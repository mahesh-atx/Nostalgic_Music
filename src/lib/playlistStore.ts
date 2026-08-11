import type { Track } from "@/lib/tracks";

export interface CustomPlaylist {
  id: string;
  name: string;
  tracks: Track[];
}

const STORAGE_KEY = "dhaba.customPlaylist";

const listeners = new Set<() => void>();

let cached: CustomPlaylist | null = null;
let loaded = false;

function refreshCache() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cached = raw ? (JSON.parse(raw) as CustomPlaylist) : null;
    if (cached && (!Array.isArray(cached.tracks) || cached.tracks.length === 0)) {
      cached = null;
    }
  } catch {
    cached = null;
  }
  loaded = true;
}

export function getCustomPlaylist(): CustomPlaylist | null {
  if (typeof window === "undefined") return null;
  if (!loaded) refreshCache();
  return cached;
}

export function saveCustomPlaylist(playlist: CustomPlaylist) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist));
  } catch {
    // storage full or blocked; playlist still applies for this session
  }
  refreshCache();
  emitPlaylistChange();
}

export function clearCustomPlaylist() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  refreshCache();
  emitPlaylistChange();
}

function emitPlaylistChange() {
  listeners.forEach((listener) => listener());
}

export function subscribePlaylist(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}