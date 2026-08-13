"use client";

import { useEffect, useState } from "react";

export type Venue = "dhaba" | "saloon" | "farmers";

/**
 * Maps the current hour (Asia/Kolkata) to the appropriate dhaba background.
 *
 *   Morning  06:00 – 16:59  →  /bg-marning.png
 *   Sunset   17:00 – 19:59  →  /bg-sunset.png
 *   Night    20:00 – 05:59  →  /bg-night.png
 */
function getTimeBasedBackground(): string {
  const now = new Date();
  const istHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    })
      .formatToParts(now)
      .find((part) => part.type === "hour")?.value ?? now.getHours()
  );

  if (istHour >= 6 && istHour < 17) return "/bg-marning.png";
  if (istHour >= 17 && istHour < 20) return "/bg-sunset.png";
  return "/bg-night.png";
}

export default function BackgroundLayer({ venue }: { venue: Venue }) {
  const [dhabaBackground, setDhabaBackground] = useState(getTimeBasedBackground);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDhabaBackground((current) => {
        const next = getTimeBasedBackground();
        return next === current ? current : next;
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <>
      <div
        className={`time-background venue-background${venue === "dhaba" ? " active" : ""}`}
        style={{ backgroundImage: `url("${dhabaBackground}")` }}
        aria-hidden="true"
      />
      <div
        className={`time-background venue-background saloon-background${venue === "saloon" ? " active" : ""}`}
        style={{ backgroundImage: 'url("/delux-saloon.png")' }}
        aria-hidden="true"
      />
      <div
        className={`time-background venue-background farmers-background${venue === "farmers" ? " active" : ""}`}
        style={{ backgroundImage: 'url("/farmer.png")' }}
        aria-hidden="true"
      />
    </>
  );
}
