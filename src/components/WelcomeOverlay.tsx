"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { requestStart } from "@/lib/playerControl";

const STORAGE_KEY = "dhaba.autostart";

/**
 * Subscribe to the "has the user already opted in?" flag. Uses
 * useSyncExternalStore so the check is hydration-safe:
 *   - on the server: returns "false" (no opt-in) — same as a cold visitor
 *   - on the client first render: reads localStorage
 *   - on subsequent renders: re-reads when the storage event fires
 */
function subscribeOptIn(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  // The "storage" event only fires for OTHER tabs, so we also listen to a
  // custom event we dispatch ourselves when the user taps play.
  const onLocal = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener("dhaba:autostart", onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("dhaba:autostart", onLocal);
  };
}

function getOptInSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerOptInSnapshot() {
  // Match what would be the cold state on a server: not opted in yet.
  return false;
}

/**
 * First-visit splash that captures a user gesture to start the YouTube player.
 *
 * Browsers (and especially iOS Safari) refuse to play audio without a user
 * interaction. This overlay is the lightest way to satisfy that requirement:
 * one tap, one fade, music plays in the background for the rest of the session.
 *
 * The dismissal is recorded in localStorage so the overlay does not reappear
 * on subsequent visits in the same browser.
 */
export default function WelcomeOverlay() {
  // useSyncExternalStore handles the SSR/client split: on the server we say
  // "not opted in" (so the overlay renders); on the client, if the user
  // has actually opted in, the overlay unmounts after hydration.
  const optedIn = useSyncExternalStore(
    subscribeOptIn,
    getOptInSnapshot,
    getServerOptInSnapshot
  );

  // Two phases: visible → fading → gone. We enter "fading" when the user has
  // tapped play, then unmount after the fade animation completes.
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = !optedIn && !dismissed;

  const start = () => {
    if (fading || dismissed) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // best-effort — overlay will reappear next time, that's fine
    }
    // Notify our own subscriber so opt-in becomes true.
    window.dispatchEvent(new Event("dhaba:autostart"));
    // This is the user gesture — tell the player to start.
    requestStart();
    setFading(true);
    window.setTimeout(() => setDismissed(true), 750);
  };

  // Keyboard / accessibility — Space / Enter also counts as a gesture.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`welcome-overlay${fading ? " fading" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Start music"
    >
      <div className="welcome-card">
        <div className="welcome-hindi" aria-hidden="true">
          डीलक्स
        </div>
        <div className="welcome-hindi welcome-hindi-sub" aria-hidden="true">
          ढाबा
        </div>

        <div className="welcome-tagline">
          Background music for the salon
        </div>

        <button
          type="button"
          className="welcome-play"
          onClick={start}
          aria-label="Play music"
          autoFocus
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5V19L19 12L8 5Z" />
          </svg>
        </button>

        <div className="welcome-hint">Tap to start the music</div>
      </div>
    </div>
  );
}

