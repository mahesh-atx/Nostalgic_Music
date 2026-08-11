export interface YTVideoData {
  title: string;
  author: string;
  video_id: string;
}

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  nextVideo(): void;
  previousVideo(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoData(): YTVideoData;
  getPlaylistIndex(): number;
  loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  loadPlaylist(playlist: {
    list: string;
    index?: number;
    startSeconds?: number;
    suggestedQuality?: string;
  }): void;
  destroy(): void;
}

export interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

export interface YTPlayerOptions {
  height: string | number;
  width: string | number;
  videoId?: string;
  host?: string;
  playerVars?: Record<string, string | number | boolean>;
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTPlayerEvent) => void;
    onError?: (event: YTPlayerEvent) => void;
  };
}

export interface YTNamespace {
  Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export {};