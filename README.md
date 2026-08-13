# डीलक्स ढाबा × सैलून — Music Player

A retro Bollywood-style fullscreen music screen with switchable Dhaba and Saloon
scenes. Plays a YouTube playlist through a hidden IFrame API player with a custom
glassmorphism UI.

## Features

- Switch between the time-aware Dhaba, Delux Saloon, Delux Kisan (Farmers), and
  Chai Tapri scenes without interrupting playback; fully responsive down to
  phones and landscape mobile, with a gentle parallax on pointer/tilt
- Hidden single-video YouTube player; 65-track static playlist with automatic
  next-track on end (`loadVideoById` + `ENDED` event, intros skipped via `start: 5`)
- Scrollable track queue in the Playlist panel — the full active playlist in
  order with the current track highlighted; click any track to jump to it
- Track title/artist/album from a bundled tracklist — no dependence on player metadata
- Local cover art (`public/covers/`), spinning album art, clickable seek bar
- Live IST clock with blinking colon and a real "online" counter (each open
  tab heartbeats `src/app/api/online/route.ts`; count = active visitors in the
  last 40s, per-server in-memory)
- Quick links to the same playlist on Spotify and YouTube Music
- "+" button in the nav lets anyone swap in their own public YouTube playlist
  (resolved server-side by `src/app/api/playlist/route.ts`; stored in the browser)
  or pick one of the four developer rotations from
  [deluxesaloon.space/playlists](https://www.deluxesaloon.space/playlists)
  (curated in `src/lib/presets.ts`)
- Automatic morning, sunset, and night backgrounds based on the current IST hour
- Graceful loading / error / retry states if the YouTube API is blocked

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command          | Description            |
| ---------------- | ---------------------- |
| `npm run dev`    | Start dev server       |
| `npm run build`  | Production build       |
| `npm run start`  | Serve production build |
| `npm run lint`   | Run ESLint             |

## Configuration

- `src/lib/tracks.ts` — the full tracklist (youtubeId, title, artist, album,
  cover path). Add/remove/reorder songs here; covers live in `public/covers/<videoId>.jpg`.
- `src/lib/links.ts` — `YT_PLAYLIST_ID` and the Spotify / YouTube Music mirror URLs.
- `src/app/api/playlist/route.ts` — server-side resolver for user-submitted
  playlists (no API key needed; parses YouTube's own page data). Capped at 120
  songs; private/unlisted playlists fail with a friendly error.
- `src/lib/playlistStore.ts` — browser-side storage of the custom playlist.
- `src/lib/presets.ts` — the four curated deluxesaloon.space rotations (60 songs
  each, with titles/artists/albums and cover art) offered inside the picker.
- `public/bg-marning.webp`, `public/bg-sunset.webp`, and `public/bg-night.webp` —
  fullscreen Dhaba backgrounds selected automatically from the current IST hour.
- `public/delux-saloon.webp` — fullscreen Delux Saloon artwork.
- `public/farmer.webp` — fullscreen Delux Kisan (Farmers) artwork.
- `public/tapri.webp` — fullscreen Chai Tapri artwork.
- `public/covers/` — per-track album art (YouTube thumbnails), pulled in by
  tracklist `cover` fields; tracks without art get a gradient placeholder.

## Deploy

The easiest option is [Vercel](https://vercel.com/new):

```bash
npx vercel
```