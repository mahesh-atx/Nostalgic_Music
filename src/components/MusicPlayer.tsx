"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import { TRACKS } from "@/lib/tracks";
import type { Track } from "@/lib/tracks";
import { getCustomPlaylist, subscribePlaylist } from "@/lib/playlistStore";
import type { CustomPlaylist } from "@/lib/playlistStore";
import {
  consumePendingStart,
  markPendingStart,
  registerStartHandler,
  reportPlaybackState,
} from "@/lib/playerControl";
import { YT_MUSIC_PLAYLIST_URL } from "@/lib/links";
import type { YTPlayer, YTPlayerEvent } from "@/types/youtube";

type PlayerStatus = "loading" | "ready" | "error";

const PLAYER_STATES = {
  PLAYING: 1,
  ENDED: 0,
} as const;

const API_LOAD_TIMEOUT_MS = 10_000;
const SKIP_INTRO_SECONDS = 5;
const PROGRESS_POLL_MS = 500;

const formatTime = (timeInSeconds: number) => {
  if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

function TrackArt({
  track,
  isPlaying,
}: {
  track: Track;
  isPlaying: boolean;
}) {
  const [failed, setFailed] = useState(false);

  const spinningClass = isPlaying ? " playing" : "";

  if (!track.cover || failed) {
    return (
      <div className={`album-art album-art-fallback${spinningClass}`}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M12 3v10.55A4 4 0 1014 17V7h4V3z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={track.cover}
      alt={`${track.title} artwork`}
      width={60}
      height={60}
      className={`album-art${spinningClass}`}
      onError={() => setFailed(true)}
      priority
    />
  );
}

export default function MusicPlayer() {
  const [trackIndex, setTrackIndexState] = useState(0);
  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const customPlaylist = useSyncExternalStore(
    subscribePlaylist,
    getCustomPlaylist,
    () => null
  );
  const tracks = customPlaylist?.tracks ?? TRACKS;

  const playerRef = useRef<YTPlayer | null>(null);
  const timerRef = useRef<number | null>(null);
  const errorStreakRef = useRef(0);
  const wantPlayRef = useRef(false);
  const trackIndexRef = useRef(0);
  const pendingPlayTimerRef = useRef<number | null>(null);
  const lastPlaylistRef = useRef<CustomPlaylist | null>(customPlaylist);
  const statusRef = useRef<PlayerStatus>("loading");

  const track = tracks[trackIndex];
  const progress = duration > 0 ? currentTime / duration : 0;

  // Keep statusRef in sync so the registered start handler always sees the
  // latest state (avoids stale-closure bugs from the [status] dep).
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearPendingPlay = () => {
    wantPlayRef.current = false;
    if (pendingPlayTimerRef.current) {
      window.clearTimeout(pendingPlayTimerRef.current);
      pendingPlayTimerRef.current = null;
    }
  };

  const updateFromPlayer = () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const current = player.getCurrentTime();
      const dur = player.getDuration();
      if (dur > 0) {
        setCurrentTime(current);
        setDuration(dur);
      }
    } catch {
      // transient; poll again next tick
    }
  };

  const goToTrack = (index: number) => {
    const player = playerRef.current;
    if (!player || tracks.length === 0) return;
    const nextIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    trackIndexRef.current = nextIndex;
    setTrackIndexState(nextIndex);
    setCurrentTime(0);
    setDuration(0);
    try {
      player.loadVideoById(tracks[nextIndex].youtubeId, SKIP_INTRO_SECONDS);
      player.playVideo();
      setIsPlaying(true);
    } catch {
      // playback errors surface through onError
    }
  };

  const resumePlayback = (player: YTPlayer) => {
    clearPendingPlay();
    wantPlayRef.current = true;
    try {
      player.mute();
      player.playVideo();
    } catch {
      // kept alive by the kick below
    }
    pendingPlayTimerRef.current = window.setTimeout(() => {
      if (!wantPlayRef.current) return;
      try {
        playerRef.current?.playVideo();
      } catch {
        // nothing left to kick
      }
      pendingPlayTimerRef.current = null;
    }, 2500);
  };

  const onPlayerReady = (event?: YTPlayerEvent) => {
    setStatus("ready");
    timerRef.current = window.setInterval(updateFromPlayer, PROGRESS_POLL_MS);
    // If the overlay (or any pending intent) asked us to start, kick it off
    // now that the player is alive.
    if (consumePendingStart()) {
      const player = event?.target ?? playerRef.current;
      if (player) {
        resumePlayback(player);
      }
    }
  };

  const onPlayerStateChange = (event: YTPlayerEvent) => {
    if (event.data === PLAYER_STATES.PLAYING) {
      errorStreakRef.current = 0;
      clearPendingPlay();
      try {
        event.target.unMute();
      } catch {
        // stay muted rather than losing playback
      }
      setIsPlaying(true);
      reportPlaybackState(true);
    } else if (event.data === PLAYER_STATES.ENDED) {
      setIsPlaying(false);
      reportPlaybackState(false);
      goToTrack(trackIndexRef.current + 1);
    } else {
      setIsPlaying(false);
      reportPlaybackState(false);
    }
  };

  const onPlayerError = (event: YTPlayerEvent) => {
    const code = event.data;

    if (code === 5) {
      setIsPlaying(false);
      clearPendingPlay();
      window.setTimeout(() => {
        try {
          playerRef.current?.playVideo();
        } catch {
          // nothing to recover from here
        }
      }, 1500);
      return;
    }

    if (code !== 2 && code !== 100 && code !== 101 && code !== 150) {
      return;
    }

    errorStreakRef.current += 1;
    if (errorStreakRef.current < 3) {
      goToTrack(trackIndexRef.current + 1);
      return;
    }

    errorStreakRef.current = 0;
    setIsPlaying(false);
    setStatus("error");
    setErrorMessage("Playback failed — try the playlist directly.");
  };

  useEffect(() => {
    if (lastPlaylistRef.current === customPlaylist) return;
    lastPlaylistRef.current = customPlaylist;
    clearPendingPlay();
    errorStreakRef.current = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    trackIndexRef.current = 0;
    setTrackIndexState(0);
    try {
      playerRef.current?.destroy();
    } catch {
      // the retry below recreates the player anyway
    }
    playerRef.current = null;
    setStatus("loading");
    setRetryKey((key) => key + 1);
  }, [customPlaylist]);

  useEffect(() => {
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled) return;
      if (!window.YT) {
        setStatus("error");
        setErrorMessage("YouTube player unavailable.");
        return;
      }
      try {
        playerRef.current?.destroy();
        playerRef.current = new window.YT.Player("yt-player", {
          height: 72,
          width: 128,
          host: "https://www.youtube-nocookie.com",
          videoId: tracks[0].youtubeId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            start: SKIP_INTRO_SECONDS,
            origin: window.location.origin,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError,
          },
        });
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Failed to start the player.");
        }
      }
    };

    if (window.YT) {
      initPlayer();
    } else {
      const timeoutId = window.setTimeout(() => {
        if (!cancelled && !window.YT) {
          setStatus("error");
          setErrorMessage("YouTube player failed to load.");
        }
      }, API_LOAD_TIMEOUT_MS);

      window.onYouTubeIframeAPIReady = () => {
        window.clearTimeout(timeoutId);
        initPlayer();
      };

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => {
        if (!cancelled) {
          window.clearTimeout(timeoutId);
          setStatus("error");
          setErrorMessage("Could not load the YouTube player.");
        }
      };
      document.head.appendChild(tag);
    }

    return () => {
      cancelled = true;
      clearPendingPlay();
      if (timerRef.current) window.clearInterval(timerRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      if (window.onYouTubeIframeAPIReady) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  useEffect(() => {
    return subscribePlaylist(() => {
      // useSyncExternalStore already re-renders this component
    });
  }, []);

  // Expose a "start" hook so the welcome overlay (or any future gesture
  // capture) can begin playback once a user tap has been registered.
  useEffect(() => {
    registerStartHandler(() => {
      const player = playerRef.current;
      if (player && statusRef.current === "ready") {
        resumePlayback(player);
      } else {
        // Player isn't ready yet — flag pending so onPlayerReady picks it up.
        // Use markPendingStart (not requestStart) to avoid a recursive loop
        // through this same handler.
        markPendingStart();
      }
    });
    return () => registerStartHandler(null);
    // resumePlayback is a stable, in-component function that uses refs; we
    // intentionally mount this handler only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    setStatus("loading");
    setErrorMessage("");
    errorStreakRef.current = 0;
    setRetryKey((key) => key + 1);
  };

  const runPlayerCommand = (command: (player: YTPlayer) => void) => {
    const player = playerRef.current;
    if (!player || status !== "ready") return;
    try {
      command(player);
    } catch {
      // real failures arrive via onError; a throw here is transient
      setIsPlaying(false);
      errorStreakRef.current = 0;
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      clearPendingPlay();
      runPlayerCommand((player) => player.pauseVideo());
    } else {
      runPlayerCommand(resumePlayback);
    }
  };

  const nextTrack = () => goToTrack(trackIndexRef.current + 1);

  const prevTrack = () => goToTrack(trackIndexRef.current - 1);

  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    const player = playerRef.current;
    if (!player || duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    try {
      player.seekTo(fraction * duration, true);
      setCurrentTime(fraction * duration);
    } catch {
      // transient
    }
  };

  return (
    <>
      <div className="yt-player-host">
        <div id="yt-player" />
      </div>

      <div className="player-container">
        <TrackArt key={track.youtubeId} track={track} isPlaying={isPlaying} />

        <div className="track-info">
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.artist || track.album}</div>

          {status === "error" ? (
            <div className="player-status player-status-error">
              <span>{errorMessage}</span>
              <button className="retry-btn" onClick={handleRetry}>
                Retry
              </button>
              <a className="retry-btn" href={YT_MUSIC_PLAYLIST_URL} target="_blank" rel="noopener noreferrer">
                Open playlist
              </a>
            </div>
          ) : status === "loading" ? (
            <div className="player-status">Loading player…</div>
          ) : (
            <div className="progress-container">
              <div
                className="progress-bar-bg"
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                onClick={handleSeek}
              >
                <div className="progress-bar-fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="time-info">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          )}
        </div>

        <div className="controls">
          <button className="control-btn" aria-label="Previous" onClick={prevTrack} disabled={status !== "ready"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6H8V18H6V6ZM9.5 12L18 18V6L9.5 12Z" />
            </svg>
          </button>
          <button className="control-btn play-btn" aria-label="Play/Pause" onClick={togglePlay} disabled={status !== "ready"}>
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5V19L19 12L8 5Z" />
              </svg>
            )}
          </button>
          <button className="control-btn" aria-label="Next" onClick={nextTrack} disabled={status !== "ready"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18L14.5 12L6 6V18ZM16 6V18H18V6H16Z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}