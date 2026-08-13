/**
 * Tiny in-memory store that lets the playlist queue (PlaylistPicker) and the
 * player (MusicPlayer) share the current track index and issue jump requests.
 */

type Listener = () => void;

let currentIndex = 0;
let pendingJump: number | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** The index of the track currently playing (or selected) in the active list. */
export function getTrackIndex(): number {
  return currentIndex;
}

/** Called by the player whenever the track changes so the queue stays in sync. */
export function setTrackIndex(index: number): void {
  if (currentIndex === index) return;
  currentIndex = index;
  emit();
}

/** A jump requested from the queue, waiting for the player to consume it. */
export function getPendingJump(): number | null {
  return pendingJump;
}

/** Called by the queue when the user clicks a track. */
export function requestJump(index: number): void {
  pendingJump = index;
  emit();
}

/** Called by the player once it has acted on a jump request. */
export function clearPendingJump(): void {
  pendingJump = null;
}

export function subscribePlayer(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
