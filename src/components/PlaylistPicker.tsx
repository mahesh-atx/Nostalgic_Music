"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  clearCustomPlaylist,
  getCustomPlaylist,
  saveCustomPlaylist,
  subscribePlaylist,
} from "@/lib/playlistStore";
import { PRESET_PLAYLISTS } from "@/lib/presets";
import type { PresetPlaylist } from "@/lib/presets";

function extractPlaylistId(input: string): string | null {
  const fromUrl = input.match(/[?&]list=([A-Za-z0-9_-]{10,60})/);
  if (fromUrl) return fromUrl[1];
  if (/^[A-Za-z0-9_-]{10,60}$/.test(input.trim())) return input.trim();
  return null;
}

export default function PlaylistPicker() {
  const customPlaylist = useSyncExternalStore(
    subscribePlaylist,
    getCustomPlaylist,
    () => null
  );
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);

  const updateAnchor = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setAnchor({
      top: rect.bottom + 14,
      right: Math.max(0, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onResize = () => updateAnchor();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updateAnchor]);

  const toggleOpen = () => {
    if (!open) updateAnchor();
    setOpen((wasOpen) => !wasOpen);
  };

  const loadPreset = (preset: PresetPlaylist) => {
    saveCustomPlaylist({
      id: preset.id,
      name: preset.name,
      tracks: preset.tracks,
    });
    setOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const playlistId = extractPlaylistId(value);
    if (!playlistId) {
      setError("That doesn't look like a YouTube playlist link.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/playlist?list=${encodeURIComponent(playlistId)}`
      );
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.tracks) || data.tracks.length === 0) {
        setError(
          typeof data.error === "string" ? data.error : "Could not load that playlist."
        );
        return;
      }
      saveCustomPlaylist({
        id: playlistId,
        name: typeof data.name === "string" && data.name ? data.name : "Custom playlist",
        tracks: data.tracks,
      });
      setValue("");
      setOpen(false);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const popoverContent = open
    ? createPortal(
        <>
          <div className="playlist-backdrop" onClick={() => setOpen(false)} />
          <div
            className="playlist-popover"
            role="dialog"
            aria-label="Playlist"
            style={
              anchor
                ? ({ "--popover-top": `${anchor.top}px`, "--popover-right": `${anchor.right}px` } as CSSProperties)
                : undefined
            }
          >
            <div className="playlist-sheet-handle" aria-hidden="true" />
            <div className="playlist-popover-title">Playlists</div>

        {customPlaylist && (
          <div className="playlist-current">
            <span className="playlist-current-name" title={customPlaylist.name}>
              {customPlaylist.name}
            </span>
            <button
              type="button"
              className="playlist-btn playlist-btn-ghost"
              onClick={() => {
                clearCustomPlaylist();
                setOpen(false);
              }}
            >
              Default
            </button>
          </div>
        )}

        <div className="preset-list">
          {PRESET_PLAYLISTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-item${customPlaylist?.id === preset.id ? " active" : ""}`}
              onClick={() => loadPreset(preset)}
            >
              <span className="preset-hindi">{preset.hindiName}</span>
              <span className="preset-sub">
                {preset.name} · {preset.tracks.length} songs
              </span>
              <span className="preset-desc">{preset.description}</span>
            </button>
          ))}
        </div>

        <div className="playlist-divider" />

        <form className="playlist-form" onSubmit={handleSubmit}>
          <input
            className="playlist-input"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="YouTube playlist link"
            maxLength={300}
          />
          <button
            className="playlist-btn"
            type="submit"
            disabled={loading || !value.trim()}
          >
            {loading ? "…" : "Load"}
          </button>
        </form>

        {error && <div className="playlist-error">{error}</div>}
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <div className="playlist-picker-wrap">
      <button
        ref={triggerRef}
        className={`app-link playlist-picker-btn${customPlaylist ? " active" : ""}`}
        type="button"
        title={customPlaylist ? `Playing: ${customPlaylist.name}` : "Add your playlist"}
        aria-label="Add your playlist"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 10h11v2H3v-2zm0-4h11v2H3V6zm0 8h7v2H3v-2zm13-1v8l7-4-7-4z" />
        </svg>
        <span className="nav-label">Playlist</span>
        <svg className="nav-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>

      {popoverContent}
    </div>
  );
}