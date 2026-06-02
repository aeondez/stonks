import { DEFAULT_ROLL_CONFIG, HEALTH_STEPS, VOLATILITY_STEPS } from "./constants.js";

// ─── Dice & Economy Logic ─────────────────────────────────────────────────────

export const roll = (sides) => Math.floor(Math.random() * sides) + 1;

export const shiftIndex = (arr, current, delta) => {
  const idx = arr.indexOf(current);
  return arr[Math.max(0, Math.min(arr.length - 1, idx + delta))];
};

export const shiftDelta = (r, cfg) => r <= cfg.improveOn ? 1 : r >= cfg.worsenOn ? -1 : 0;

export function computeAdvance(stocks, cfg = DEFAULT_ROLL_CONFIG) {
  const priceDice = { High: cfg.dieHigh, Medium: cfg.dieMedium, Low: cfg.dieLow };
  const results = stocks.map((s) => {
    if (s.is_collapsed || s.is_frozen) return { ...s, healthRoll: null, volRoll: null, priceRoll: null, coinFlip: null };

    const healthRoll = roll(cfg.shiftDie);
    const volRoll = roll(cfg.shiftDie);
    const healthDelta = shiftDelta(healthRoll, cfg);
    const volDelta = shiftDelta(volRoll, cfg);

    let newHealth = shiftIndex(HEALTH_STEPS, s.health, healthDelta);
    let newVol = shiftIndex(VOLATILITY_STEPS, s.volatility, volDelta);

    if (s.is_omnicorp) {
      const badOrBelow = ["Bad", "Bankrupt"].includes(newHealth);
      if (badOrBelow) newHealth = "OK";
      if (VOLATILITY_STEPS.indexOf(newVol) < VOLATILITY_STEPS.indexOf(s.volatility)) newVol = s.volatility;
    }

    const die = priceDice[newVol];
    const priceRoll = roll(die);
    let coinFlip = null;
    let priceDelta = 0;

    if (newHealth === "Good") {
      priceDelta = priceRoll;
    } else if (newHealth === "OK") {
      coinFlip = roll(2) === 1 ? "up" : "down";
      priceDelta = coinFlip === "up" ? priceRoll : -priceRoll;
    } else if (newHealth === "Bad") {
      priceDelta = -priceRoll;
    } else if (newHealth === "Bankrupt") {
      const halved = Math.max(1, Math.floor(s.price / 2));
      const afterSubtract = Math.max(1, halved - priceRoll);
      priceDelta = afterSubtract - s.price;
    }

    if (s.is_omnicorp && priceDelta < 0) priceDelta = 0;

    const newPrice = Math.max(1, s.price + priceDelta);
    return {
      ...s, health: newHealth, volatility: newVol, price: newPrice, change: newPrice - s.price,
      healthRoll, volRoll, priceRoll, coinFlip, healthShift: healthDelta, volShift: volDelta,
    };
  });
  return results;
}

export function bumpHealth(stock) {
  if (["OK", "Good"].includes(stock.health)) return stock;
  return { ...stock, health: shiftIndex(HEALTH_STEPS, stock.health, 1) };
}

export function computeBankruptcyCheck(stocks, mergers = [], alwaysMerge = true) {
  return stocks.map((s) => {
    if (s.is_collapsed || s.is_omnicorp || s.is_frozen) return { ...s, bankruptRoll: null, collapses: false, triggersMerger: null };
    if (s.health !== "Bankrupt") return { ...s, bankruptRoll: null, collapses: false, triggersMerger: null };
    const bankruptRoll = roll(10);
    const collapses = bankruptRoll >= 7;
    let triggersMerger = null;
    if (collapses && alwaysMerge) {
      const m = mergers.find((m) => !m.triggered &&
        getMergerStatus(m, stocks) === "pending" &&
        (m.partner1 === s.name || m.partner2 === s.name));
      if (m) triggersMerger = m.name;
    }
    return { ...s, bankruptRoll, collapses, triggersMerger };
  });
}

export function computeVariance(stocks, cfg = DEFAULT_ROLL_CONFIG) {
  const priceDice = { High: cfg.dieHigh, Medium: cfg.dieMedium, Low: cfg.dieLow };
  return stocks.map((s) => {
    if (s.is_collapsed || s.is_frozen) return { ...s, priceRoll: null, coinFlip: null };
    const die = priceDice[s.volatility];
    const priceRoll = roll(die);
    let coinFlip = null;
    let priceDelta = 0;
    if (s.health === "Good") {
      priceDelta = priceRoll;
    } else if (s.health === "OK") {
      coinFlip = roll(2) === 1 ? "up" : "down";
      priceDelta = coinFlip === "up" ? priceRoll : -priceRoll;
    } else if (s.health === "Bad" || s.health === "Bankrupt") {
      priceDelta = -priceRoll;
    }
    if (s.is_omnicorp && priceDelta < 0) priceDelta = 0;
    const newPrice = Math.max(1, s.price + priceDelta);
    return { ...s, price: newPrice, change: newPrice - s.price, priceRoll, coinFlip };
  });
}

export function computeHealthOnly(stocks, cfg = DEFAULT_ROLL_CONFIG) {
  return stocks.map((s) => {
    if (s.is_collapsed || s.is_frozen) return { ...s, healthRoll: null, healthShift: 0 };
    const healthRoll = roll(cfg.shiftDie);
    const healthDelta = shiftDelta(healthRoll, cfg);
    let newHealth = shiftIndex(HEALTH_STEPS, s.health, healthDelta);
    if (s.is_omnicorp && ["Bad", "Bankrupt"].includes(newHealth)) newHealth = "OK";
    return { ...s, health: newHealth, healthRoll, healthShift: healthDelta };
  });
}

export const sortByPrice = (stocks) => [...stocks].sort((a, b) => b.price - a.price);

export const getMergerStatus = (merger, stocks) => {
  if (merger.triggered) return "triggered";
  const p1 = stocks.some((s) => s.name === merger.partner1 && !s.is_collapsed && !s.is_delisting);
  const p2 = stocks.some((s) => s.name === merger.partner2 && !s.is_collapsed && !s.is_delisting);
  if (!p1 || !p2) return "unavailable";
  return "pending";
};

export const applyMerger = (stocks, merger) => {
  const p1 = stocks.find((s) => s.name === merger.partner1);
  const p2 = stocks.find((s) => s.name === merger.partner2);
  const mergedPrice = (p1?.price ?? 0) + (p2?.price ?? 0);
  const mergedEntity = {
    name: merger.name, industry: merger.industry,
    price: mergedPrice, change: 0, health: "OK", volatility: "Medium",
    is_omnicorp: false, is_collapsed: false, is_merged: true,
  };
  return stocks.filter((s) => s.name !== merger.partner1 && s.name !== merger.partner2).concat([mergedEntity]);
};

export const computeMarketCap = (stocks) =>
  Math.floor(stocks.filter(s => !s.is_collapsed && !s.is_omnicorp).reduce((s, x) => s + (x.price || 0), 0));
