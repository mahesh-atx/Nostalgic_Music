import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONLINE_TTL_MS = 40_000;

const sessions = new Map<string, number>();

function prune(now: number) {
  for (const [sessionId, lastBeat] of sessions) {
    if (now - lastBeat > ONLINE_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}

function currentOnline(now = Date.now()): number {
  prune(now);
  return sessions.size;
}

export async function POST(request: Request) {
  let sessionId = "";
  try {
    const body = await request.json();
    if (typeof body?.sessionId === "string") sessionId = body.sessionId;
  } catch {
    // keep the default empty session id
  }

  if (sessionId.length > 0 && sessionId.length <= 64) {
    sessions.set(sessionId, Date.now());
  }

  return NextResponse.json({ online: currentOnline() });
}

export async function GET() {
  return NextResponse.json({ online: currentOnline() });
}