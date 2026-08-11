/**
 * Tiny event bus that lets outside code (e.g. the welcome overlay) ask the
 * MusicPlayer to start playback once a user gesture has been registered.
 *
 * This is the cleanest way to wire the splash-overlay "play" button to the
 * hidden IFrame player without lifting the player's internals up to the page.
 */

type StartHandler = () => void;

let startHandler: StartHandler | null = null;

export function registerStartHandler(handler: StartHandler | null) {
  startHandler = handler;
}

/**
 * Called from a user-gesture handler (e.g. overlay click). If the player has
 * already mounted, this kicks off playback. If not yet mounted, the player
 * will pick up the pending intent on its first ready event.
 */
let pendingStart = false;

export function requestStart() {
  if (startHandler) {
    startHandler();
    return;
  }
  // Player not ready yet — mark intent; the player will honor it on mount.
  pendingStart = true;
}

export function consumePendingStart(): boolean {
  if (pendingStart) {
    pendingStart = false;
    return true;
  }
  return false;
}

/**
 * Flag a "please start" intent for the player to honor when it next becomes
 * ready. Unlike `requestStart`, this does NOT call back into the registered
 * start handler — so it's safe to call from inside the handler itself.
 */
export function markPendingStart() {
  pendingStart = true;
}

// ----------------------------------------------------------------------
// Playback state reporter — the MusicPlayer pings this when YT IFrame
// state changes, so other components (e.g. the welcome splash) can know
// when audio has actually started and adjust their own state.
// ----------------------------------------------------------------------

type PlayingListener = (playing: boolean) => void;
const playingListeners = new Set<PlayingListener>();

export function reportPlaybackState(playing: boolean) {
  for (const listener of playingListeners) listener(playing);
}
