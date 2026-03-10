import React from "react";
import ReactDOM from "react-dom/client";
import StonksApp from "./StonksApp.jsx";
import RoomGate from "./RoomGate.jsx";

const hostname = window.location.hostname;
const isLocal =
  hostname === "localhost" ||
  /^192\.168\./.test(hostname) ||
  /^10\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

const path = window.location.pathname;
const roomMatch = path.match(/^\/room\/([A-Z0-9]{6})$/i);

let rootEl;
if (isLocal) {
  rootEl = <StonksApp roomCode="stonks" />;
} else if (roomMatch) {
  rootEl = <StonksApp roomCode={roomMatch[1].toUpperCase()} />;
} else {
  rootEl = <RoomGate />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{rootEl}</React.StrictMode>
);
