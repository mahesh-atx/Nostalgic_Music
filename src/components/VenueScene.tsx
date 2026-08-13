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
  farmers: {
    kicker: "संगीत और खेती",
    title: ["डीलक्स", "किसान"],
    subtitle: "पुराने नग़मे, हरे खेत",
    caption: "Farming classics · always on",
  },
  tapri: {
    kicker: "संगीत और कड़क चाय",
    title: ["डीलक्स", "टपरी"],
    subtitle: "पुराने नग़मे, कड़क चाय",
    caption: "Chai tapri · always on",
  },
  era2010: {
    kicker: "संगीत और 2010",
    title: ["डीलक्स", "2010"],
    subtitle: "पुराने नग़मे, 2010 का दौर",
    caption: "2010 era · always on",
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
        <button
          className={`venue-option${venue === "farmers" ? " active" : ""}`}
          type="button"
          aria-pressed={venue === "farmers"}
          onClick={() => setVenue("farmers")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 22v-9" />
            <path d="M12 13c0-3.4 2.2-5.6 5.4-5.6 0 3.4-2.2 5.6-5.4 5.6Z" />
            <path d="M12 13c0-3.4-2.2-5.6-5.4-5.6 0 3.4 2.2 5.6 5.4 5.6Z" />
          </svg>
          <span>Farmers</span>
        </button>
        <button
          className={`venue-option${venue === "tapri" ? " active" : ""}`}
          type="button"
          aria-pressed={venue === "tapri"}
          onClick={() => setVenue("tapri")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 8h13v6a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5V8Z" />
            <path d="M18 10h2a2 2 0 0 1 0 4h-2" />
            <path d="M8.5 5c0-1.2.7-2 1.5-2s1.5.8 1.5 2" />
            <path d="M12.5 5c0-1.2.7-2 1.5-2s1.5.8 1.5 2" />
          </svg>
          <span>Tapri</span>
        </button>
        <button
          className={`venue-option${venue === "era2010" ? " active" : ""}`}
          type="button"
          aria-pressed={venue === "era2010"}
          onClick={() => setVenue("era2010")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>2010</span>
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
