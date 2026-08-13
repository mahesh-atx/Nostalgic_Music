"use client";

import { useState } from "react";
import BackgroundLayer from "@/components/BackgroundLayer";
import type { Venue } from "@/components/BackgroundLayer";

const VENUE_COPY = {
  dhaba: {
    kicker: "चौबीसों घंटे संगीत",
    title: ["डीलक्स", "ढाबा"],
    subtitle: "पुराने नग़मे, गरम चाय",
    caption: "Bollywood classics · always on",
  },
  saloon: {
    kicker: "संगीत और स्टाइल",
    title: ["डीलक्स", "सैलून"],
    subtitle: "पुराने नग़मे, नई कटिंग",
    caption: "Classic cuts · timeless tunes",
  },
} as const;

export default function VenueScene() {
  const [venue, setVenue] = useState<Venue>("dhaba");
  const copy = VENUE_COPY[venue];

  return (
    <>
      <BackgroundLayer venue={venue} />

      <div className="venue-switch" role="group" aria-label="Choose venue">
        <span className="venue-switch-label">Visit</span>
        <button
          className={`venue-option${venue === "dhaba" ? " active" : ""}`}
          type="button"
          aria-pressed={venue === "dhaba"}
          onClick={() => setVenue("dhaba")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 8h14l-1 11H6L5 8Zm3-3h8l2 3H6l2-3Zm1 7v3m3-3v3m3-3v3" />
          </svg>
          <span>Dhaba</span>
        </button>
        <button
          className={`venue-option${venue === "saloon" ? " active" : ""}`}
          type="button"
          aria-pressed={venue === "saloon"}
          onClick={() => setVenue("saloon")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="6" cy="7" r="3" />
            <circle cx="6" cy="17" r="3" />
            <path d="m8.7 8.4 10.8 6.1M8.7 15.6 19.5 9.5M12 12l7.5-4" />
          </svg>
          <span>Saloon</span>
        </button>
      </div>

      <main className={`hero hero-${venue}`}>
        <div className="main-title-container" key={venue} aria-live="polite">
          <p className="brand-kicker">
            <span className="brand-kicker-line" aria-hidden="true" />
            {copy.kicker}
          </p>
          <h1 className="main-title">
            {copy.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className="brand-subtitle">{copy.subtitle}</p>
          <p className="brand-caption">{copy.caption}</p>
        </div>
      </main>
    </>
  );
}
