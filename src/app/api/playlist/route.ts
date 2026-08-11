import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TRACKS = 120;
const CACHE_TTL_MS = 30 * 60 * 1000;

interface PlaylistItem {
  youtubeId: string;
  title: string;
  artist: string;
  cover: string | null;
}

interface PlaylistResult {
  name: string;
  tracks: PlaylistItem[];
}

const cache = new Map<string, { fetchedAt: number; result: PlaylistResult }>();

function parsePlaylistHtml(html: string): PlaylistResult {
  let name = "YouTube playlist";
  const tracks: PlaylistItem[] = [];
  const seen = new Set<string>();

  const start = html.indexOf("var ytInitialData = ");
  if (start >= 0) {
    const jsonStart = start + "var ytInitialData = ".length;
    const jsonEnd = html.indexOf("</script>", jsonStart);
    if (jsonEnd > jsonStart) {
      let blob = html.slice(jsonStart, jsonEnd).trim();
      if (blob.endsWith(";")) blob = blob.slice(0, -1);
      try {
        const data = JSON.parse(blob);
        const microTitle = data?.microformat?.microformatDataRenderer?.title;
        if (typeof microTitle === "string" && microTitle) name = microTitle;

        const contents =
          data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
            ?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer
            ?.contents;
        if (Array.isArray(contents)) {
          for (const entry of contents) {
            const lockup = entry?.lockupViewModel;
            if (!lockup) continue;
            const youtubeId = String(lockup.contentId ?? "");
            if (
              !/^[A-Za-z0-9_-]{11}$/.test(youtubeId) ||
              seen.has(youtubeId)
            ) {
              continue;
            }
            const meta = lockup.metadata?.lockupMetadataViewModel;
            const title = String(meta?.title?.content ?? "");
            if (!title) continue;
            seen.add(youtubeId);

            let artist = "";
            const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows;
            if (Array.isArray(rows)) {
              for (const row of rows) {
                for (const part of row?.metadataParts ?? []) {
                  const text = String(part?.text?.content ?? "");
                  if (text && !/^\d+:\d+$/.test(text)) {
                    artist = text;
                    break;
                  }
                }
                if (artist) break;
              }
            }

            const sources =
              lockup.contentImage?.thumbnailViewModel?.image?.sources;
            const cover =
              Array.isArray(sources) && sources.length > 0
                ? String(sources[sources.length - 1]?.url ?? "")
                : "";
            tracks.push({
              youtubeId,
              title,
              artist,
              cover: cover.startsWith("https://") ? cover : null,
            });
            if (tracks.length >= MAX_TRACKS) break;
          }
        }
      } catch {
        // fall through to the regex pass
      }
    }
  }

  if (tracks.length === 0) {
    const idPattern = /"contentId":"([A-Za-z0-9_-]{11})"/g;
    let match: RegExpExecArray | null;
    while ((match = idPattern.exec(html)) !== null) {
      const youtubeId = match[1];
      if (seen.has(youtubeId)) continue;
      seen.add(youtubeId);
      tracks.push({
        youtubeId,
        title: "",
        artist: "",
        cover: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      });
      if (tracks.length >= MAX_TRACKS) break;
    }
    if (tracks.length > 0) name = "YouTube playlist (IDs only)";
  }

  return { name, tracks };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listId = (searchParams.get("list") ?? "").trim();

  if (!/^[A-Za-z0-9_-]{10,60}$/.test(listId)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid YouTube playlist." },
      { status: 400 }
    );
  }

  const cached = cache.get(listId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.result);
  }

  let html: string;
  try {
    const response = await fetch(
      `https://www.youtube.com/playlist?list=${encodeURIComponent(listId)}&hl=en`,
      {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          "Accept-Language": "en-IN,en;q=0.9",
        },
      }
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "YouTube didn't answer (status " + response.status + ")." },
        { status: 502 }
      );
    }
    html = await response.text();
  } catch {
    return NextResponse.json(
      { error: "Could not reach YouTube. Try again in a moment." },
      { status: 502 }
    );
  }

  const result = parsePlaylistHtml(html);

  if (result.tracks.length === 0) {
    return NextResponse.json(
      {
        error:
          "No videos found — the playlist may be private, unlisted or unavailable.",
      },
      { status: 404 }
    );
  }

  cache.set(listId, { fetchedAt: Date.now(), result });
  return NextResponse.json(result);
}