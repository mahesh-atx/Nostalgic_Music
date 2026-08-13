"use client";

import { useEffect, useRef, useState } from "react";

export type Venue = "dhaba" | "saloon" | "farmers" | "tapri" | "era2010";

const PARALLAX_MAX_SHIFT = 9; // px the background can drift
const PARALLAX_SCALE = 1.06; // extra zoom so the edges never show
const PARALLAX_LERP = 0.08; // smoothing factor

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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

  if (istHour >= 6 && istHour < 17) return "/bg-marning.webp";
  if (istHour >= 17 && istHour < 20) return "/bg-sunset.webp";
  return "/bg-night.webp";
}

export default function BackgroundLayer({ venue }: { venue: Venue }) {
  const [dhabaBackground, setDhabaBackground] = useState(getTimeBasedBackground);
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDhabaBackground((current) => {
        const next = getTimeBasedBackground();
        return next === current ? current : next;
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Gentle parallax: the background drifts with the pointer (desktop) or with
  // device tilt (mobile). Skips entirely when reduced motion is preferred.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    const onPointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0; // left/right tilt
      const beta = event.beta ?? 0; // front/back tilt
      targetX = clamp(gamma / 30, -1, 1);
      targetY = clamp(beta / 30, -1, 1);
    };

    const reset = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      currentX += (targetX - currentX) * PARALLAX_LERP;
      currentY += (targetY - currentY) * PARALLAX_LERP;

      if (Math.abs(currentX) < 0.001 && Math.abs(currentY) < 0.001) {
        currentX = 0;
        currentY = 0;
      }

      const x = (currentX * PARALLAX_MAX_SHIFT).toFixed(2);
      const y = (currentY * PARALLAX_MAX_SHIFT).toFixed(2);
      const transform = `translate3d(${x}px, ${y}px, 0) scale(${PARALLAX_SCALE})`;

      for (const layer of layersRef.current) {
        if (layer) layer.style.transform = transform;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("blur", reset);
    document.addEventListener("mouseleave", reset);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("blur", reset);
      document.removeEventListener("mouseleave", reset);
    };
  }, []);

  return (
    <>
      <div
        ref={(node) => {
          layersRef.current[0] = node;
        }}
        className={`time-background venue-background${venue === "dhaba" ? " active" : ""}`}
        style={{ backgroundImage: `url("${dhabaBackground}")` }}
        aria-hidden="true"
      />
      <div
        ref={(node) => {
          layersRef.current[1] = node;
        }}
        className={`time-background venue-background saloon-background${venue === "saloon" ? " active" : ""}`}
        style={{ backgroundImage: 'url("/delux-saloon.webp")' }}
        aria-hidden="true"
      />
      <div
        ref={(node) => {
          layersRef.current[2] = node;
        }}
        className={`time-background venue-background farmers-background${venue === "farmers" ? " active" : ""}`}
        style={{ backgroundImage: 'url("/farmer.png")' }}
        aria-hidden="true"
      />
      <div
        ref={(node) => {
          layersRef.current[3] = node;
        }}
        className={`time-background venue-background tapri-background${venue === "tapri" ? " active" : ""}`}
        style={{ backgroundImage: 'url("/chai-bg.png")' }}
        aria-hidden="true"
      />
      <div
        ref={(node) => {
          layersRef.current[4] = node;
        }}
        className={`time-background venue-background era2010-background${venue === "era2010" ? " active" : ""}`}
        style={{ backgroundImage: 'url("/2009-10era.png")' }}
        aria-hidden="true"
      />
    </>
  );
}
