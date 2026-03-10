# Deploying Stonks to the Internet

This gives you a public URL you can share with anyone. Each game gets a unique 6-character room code. Room data expires after 30 days of inactivity and the code gets recycled.

Your local version (`npm start`) is completely unaffected by any of this.

---

## What You'll Set Up

| Service | What it does | Cost |
|---|---|---|
| GitHub | Stores your code | Free |
| Vercel | Hosts the app | Free |
| Upstash | Stores game data (Redis) | Free |

Total cost: $0.

---

## Step 1 — Push to GitHub

1. Create a free account at [github.com](https://github.com) if you don't have one
2. Click **New repository**, name it `stonks`, set it to **Public**, click **Create**
3. In your terminal, from inside the `stonks/` folder:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stonks.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2 — Set Up Upstash (database)

1. Create a free account at [upstash.com](https://upstash.com)
2. Click **Create Database**
3. Name it anything (e.g. `stonks`), pick a region close to you, leave everything else default
4. Click **Create**
5. On the database page, scroll down to **REST API**
6. Copy the two values — you'll need them in Step 3:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## Step 3 — Deploy to Vercel

1. Create a free account at [vercel.com](https://vercel.com) — sign in with your GitHub account
2. Click **Add New → Project**
3. Find your `stonks` repository and click **Import**
4. Vercel will auto-detect Vite. Don't change any build settings.
5. Before clicking Deploy, click **Environment Variables** and add both values from Step 2:
   - Name: `UPSTASH_REDIS_REST_URL` — paste the URL
   - Name: `UPSTASH_REDIS_REST_TOKEN` — paste the token
6. Click **Deploy**

After a minute or two, Vercel will give you a URL like `https://stonks-abc123.vercel.app`.

---

## Step 4 — Share It

Send players to your Vercel URL. They'll see the room gate.

**As Warden:**
- Go to the URL, click **CREATE NEW GAME**
- You'll get a 6-character room code and be taken into the app
- Share the full URL (e.g. `https://stonks-abc123.vercel.app/room/AB3X7K`) or just the code

**As a player:**
- Go to the URL, enter the room code, click **JOIN GAME**
- Or just open the full URL the Warden shared

The Warden access PIN and dashboard work exactly the same as local — tap **WARDEN ACCESS** at the bottom of the player view.

---

## Updating the App

Any time you make changes and want to push them live:

```bash
git add .
git commit -m "describe your change"
git push
```

Vercel automatically re-deploys within about 60 seconds.

---

## Custom Domain (optional)

If you want a cleaner URL like `stonks.yourdomain.com`:
1. In Vercel, go to your project → **Settings → Domains**
2. Add your domain and follow the DNS instructions

---

## Room Code Notes

- Codes are 6 characters, uppercase letters and numbers (no confusable chars like 0/O or 1/I/L)
- A room expires and its code is recycled after **30 days of no activity**
- If you want a game to persist longer, just open it occasionally
- ~1 billion possible codes — collisions are essentially impossible
