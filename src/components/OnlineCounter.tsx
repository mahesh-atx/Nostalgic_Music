"use client";

import { useEffect, useState } from "react";

const HEARTBEAT_MS = 20_000;

function visitorId(): string {
  try {
    let id = window.localStorage.getItem("dhaba.visitorId");
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem("dhaba.visitorId", id);
    }
    return id;
  } catch {
    return "";
  }
}

export default function OnlineCounter() {
  const [online, setOnline] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const beat = async () => {
      try {
        const response = await fetch("/api/online", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: visitorId() }),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && typeof data.online === "number") {
          setOnline(data.online);
        }
      } catch {
        // server unreachable — keep showing the last known value
      }
    };

    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="online-status" aria-live="polite">
      <span className="dot-pulse">
        <span className="dot-ping" />
        <span className="dot" />
      </span>
      <span>{online}</span>
      <span className="online-label">online</span>
    </div>
  );
}