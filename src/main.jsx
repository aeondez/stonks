import React, { useState, useEffect } from "react";
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

function Root() {
  const [status, setStatus] = useState("checking"); // "checking" | "ok" | "not_found" | "error"

  useEffect(() => {
    if (isLocal || !roomMatch) {
      setStatus("ok");
      return;
    }
    const code = roomMatch[1].toUpperCase();
    fetch(`/api/room?code=${code}`)
      .then((r) => r.json())
      .then((data) => setStatus(data.exists ? "ok" : "not_found"))
      .catch(() => setStatus("error"));
  }, []);

  if (isLocal) {
    return <StonksApp roomCode="stonks" />;
  }

  if (!roomMatch) {
    return <RoomGate />;
  }

  if (status === "checking") {
    return <RoomGate initializing />;
  }

  if (status === "ok") {
    return <StonksApp roomCode={roomMatch[1].toUpperCase()} />;
  }

  // not_found or error — send back to gate with a message
  return (
    <RoomGate
      initialError={
        status === "not_found"
          ? "Game not found. Check your code."
          : "Could not reach server. Try again."
      }
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
