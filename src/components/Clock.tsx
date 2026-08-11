"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function formatParts(date: Date) {
  const parts = formatter.formatToParts(date);
  const find = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { hour: find("hour"), minute: find("minute"), period: find("dayPeriod") };
}

export default function Clock() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(() => formatParts(new Date()));

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTime(formatParts(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="time" suppressHydrationWarning>
      {mounted ? time.hour : ""}
      <span className="clock-colon">{mounted ? ":" : ""}</span>
      {mounted ? time.minute : ""}
      <span className="clock-period">{mounted ? time.period : ""}</span>
    </div>
  );
}