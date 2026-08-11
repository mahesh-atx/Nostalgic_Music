"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent } from "react";
import {
  clearBackground,
  getSavedBackgroundName,
  saveBackground,
  subscribeBackground,
} from "@/lib/backgroundStore";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export default function BackgroundPicker() {
  const activeName = useSyncExternalStore(
    subscribeBackground,
    getSavedBackgroundName,
    () => null
  );
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is larger than 20 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    saveBackground(file, file.name);
    setOpen(false);
    event.target.value = "";
  };

  const popoverContent = open && mounted ? (
    <>
      <div className="playlist-backdrop" onClick={() => setOpen(false)} />
      <div className="playlist-popover" role="dialog" aria-label="Change background">
        <div className="playlist-popover-title">Change background</div>

        <label className="playlist-btn playlist-btn-full">
          Choose image…
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
        </label>

        {activeName ? (
          <div className="playlist-current">
            <span className="playlist-current-name" title={activeName}>
              {activeName}
            </span>
            <button
              type="button"
              className="playlist-btn playlist-btn-ghost"
              onClick={() => {
                clearBackground();
                setOpen(false);
              }}
            >
              Restore default
            </button>
          </div>
        ) : (
          <div className="playlist-hint">None yet — the salon poster is showing.</div>
        )}

        <div className="playlist-hint">
          Image fills the screen, edge to edge. Best at 1080p or larger.
        </div>

        {error && <div className="playlist-error">{error}</div>}
      </div>
    </>
  ) : null;

  return (
    <div className="playlist-picker-wrap bg-picker-wrap">
      <button
        className={`app-link playlist-picker-btn${activeName ? " active" : ""}`}
        type="button"
        title={activeName ? `Background: ${activeName}` : "Change background"}
        aria-label="Change background"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19 19H5v-4.5l4.5-4.5 4.5 4.5 3-3L19 13v6z" />
        </svg>
        <span className="nav-label">Background</span>
        <svg className="nav-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px" }}>
          <line x1="7" y1="17" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </button>

      {popoverContent}
    </div>
  );
}