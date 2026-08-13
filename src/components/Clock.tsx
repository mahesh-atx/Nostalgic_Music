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
  const [time, setTime] = useState<ReturnType<typeof formatParts> | null>(null);

  useEffect(() => {
    const update = () => setTime(formatParts(new Date()));
    const initialId = window.setTimeout(update, 0);
    const intervalId = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="time" suppressHydrationWarning>
      {time?.hour ?? ""}
      <span className="clock-colon">{time ? ":" : ""}</span>
      {time?.minute ?? ""}
      <span className="clock-period">{time?.period ?? ""}</span>
    </div>
  );
}