"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBackgroundImage,
  subscribeBackground,
  getSavedBackgroundName,
} from "@/lib/backgroundStore";

/**
 * Maps the current hour (Asia/Kolkata) to the appropriate dhaba background.
 *
 *   Morning  06:00 – 16:59  →  /bg-marning.png
 *   Sunset   17:00 – 19:59  →  /bg-sunset.png
 *   Night    20:00 – 05:59  →  /bg-night.png
 */
function getTimeBasedBackground(): string {
  const now = new Date();
  // Use IST (Asia/Kolkata) so the background matches the Clock component
  const istHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    })
      .formatToParts(now)
      .find((p) => p.type === "hour")?.value ?? now.getHours()
  );

  if (istHour >= 6 && istHour < 17) return "/bg-marning.png";
  if (istHour >= 17 && istHour < 20) return "/bg-sunset.png";
  return "/bg-night.png";
}

export default function BackgroundLayer() {
  /* ---- custom (user-uploaded) background ---- */
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const applyCustom = useCallback(async () => {
    const blob = await getBackgroundImage();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (blob) {
      objectUrlRef.current = URL.createObjectURL(blob);
      setCustomUrl(objectUrlRef.current);
    } else {
      setCustomUrl(null);
    }
  }, []);

  useEffect(() => {
    applyCustom();
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [applyCustom]);

  useEffect(() => subscribeBackground(applyCustom), [applyCustom]);

  /* ---- time-based default background ---- */
  const [timeBg, setTimeBg] = useState<string>(() => getTimeBasedBackground());

  useEffect(() => {
    // Re-evaluate every 60 seconds so the background transitions at the right time
    const id = setInterval(() => {
      setTimeBg((prev) => {
        const next = getTimeBasedBackground();
        return next !== prev ? next : prev;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const hasCustom = !!getSavedBackgroundName();
  const showUrl = hasCustom && customUrl ? customUrl : timeBg;

  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory((prev) => {
      if (prev[prev.length - 1] === showUrl) return prev;
      return [...prev.slice(-1), showUrl];
    });
  }, [showUrl]);

  return (
    <>
      {history.map((url, i) => (
        <div
          key={url}
          className="time-background"
          style={{
            backgroundImage: `url("${url}")`,
            zIndex: i,
            animation: i > 0 ? "bg-fade-in 1.5s ease-in-out forwards" : "none",
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}