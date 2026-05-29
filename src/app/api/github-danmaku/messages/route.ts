import { NextResponse } from "next/server";

import {
  createIssueMessage,
  getSessionUser,
  listIssueMessages,
  missingConfig,
  type DanmakuMessage,
} from "../lib";

const userPosts = new Map<string, number[]>();

function isValidDay(day: string | null) {
  return Boolean(day && /^\d{4}-\d{2}-\d{2}$/.test(day));
}

function rateLimited(userId: number) {
  const now = Date.now();
  const key = String(userId);
  const recent = (userPosts.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 6) {
    userPosts.set(key, recent);
    return true;
  }
  userPosts.set(key, [...recent, now]);
  return false;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const day = url.searchParams.get("day");
  if (!isValidDay(day)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  if (missingConfig().write) {
    return NextResponse.json({ messages: [], missingWriteConfig: true });
  }

  try {
    const messages = await listIssueMessages(day as string);
    return NextResponse.json(
      { messages },
      {
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=240",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "GitHub sync failed" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "GitHub login required" }, { status: 401 });
  }
  if (missingConfig().write) {
    return NextResponse.json(
      { error: "GITHUB_DANMAKU_TOKEN is not configured" },
      { status: 503 },
    );
  }
  if (rateLimited(user.id)) {
    return NextResponse.json(
      { error: "Rate limited. Please wait before sending again." },
      { status: 429 },
    );
  }

  const body = (await request.json()) as {
    clientId?: string;
    text?: string;
    day?: string;
    createdAt?: string;
    extensions?: Record<string, unknown>;
  };
  const text = body.text?.trim().slice(0, 140);
  if (!text) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }
  if (!isValidDay(body.day ?? null)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const message: DanmakuMessage = {
    id: body.clientId ?? crypto.randomUUID(),
    clientId: body.clientId ?? crypto.randomUUID(),
    kind: "text",
    text,
    createdAt: body.createdAt ?? new Date().toISOString(),
    day: body.day as string,
    user,
    status: "confirmed",
    schemaVersion: 1,
    extensions: body.extensions,
  };

  try {
    return NextResponse.json({ message: await createIssueMessage(message) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "GitHub write failed" },
      { status: 502 },
    );
  }
}

