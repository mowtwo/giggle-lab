import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";

const sessionCookie = "giggle_danmaku_session";
const stateCookie = "giggle_danmaku_state";
const marker = "<!-- giggle-danmaku:v1 -->";

export type GithubDanmakuUser = {
  id: number;
  login: string;
  name: string;
  avatarUrl: string;
  htmlUrl: string;
};

export type DanmakuMessage = {
  id: string;
  clientId: string;
  kind: "text";
  text: string;
  createdAt: string;
  day: string;
  user: GithubDanmakuUser;
  status: "confirmed";
  schemaVersion: 1;
  extensions?: Record<string, unknown>;
};

type GithubIssue = {
  number: number;
  title: string;
};

type GithubComment = {
  id: number;
  body?: string;
  created_at: string;
};

export function danmakuConfig() {
  return {
    owner: process.env.GITHUB_DANMAKU_OWNER ?? "mowtwo",
    repo: process.env.GITHUB_DANMAKU_REPO ?? "giggle-lab",
    token: process.env.GITHUB_DANMAKU_TOKEN ?? process.env.GITHUB_TOKEN,
    clientId: process.env.GITHUB_DANMAKU_CLIENT_ID,
    clientSecret: process.env.GITHUB_DANMAKU_CLIENT_SECRET,
    sessionSecret:
      process.env.GITHUB_DANMAKU_SESSION_SECRET ??
      process.env.AUTH_SECRET ??
      process.env.NEXTAUTH_SECRET,
  };
}

export function missingConfig() {
  const config = danmakuConfig();
  return {
    auth: !config.clientId || !config.clientSecret || !config.sessionSecret,
    write: !config.token,
  };
}

function secret() {
  const config = danmakuConfig();
  if (!config.sessionSecret) {
    throw new Error("Missing GITHUB_DANMAKU_SESSION_SECRET");
  }
  return config.sessionSecret;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createState() {
  return randomBytes(18).toString("base64url");
}

export async function setStateCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(stateCookie, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
}

export async function consumeStateCookie() {
  const cookieStore = await cookies();
  const value = cookieStore.get(stateCookie)?.value;
  cookieStore.delete(stateCookie);
  return value;
}

export async function setSessionCookie(user: GithubDanmakuUser) {
  const cookieStore = await cookies();
  const payload = Buffer.from(
    JSON.stringify({
      user,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    }),
  ).toString("base64url");
  cookieStore.set(sessionCookie, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const value = cookieStore.get(sessionCookie)?.value;
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const valid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) return null;

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
    user: GithubDanmakuUser;
    exp: number;
  };
  return parsed.exp > Date.now() ? parsed.user : null;
}

export function dayIssueTitle(day: string) {
  return `[danmaku] ${day}`;
}

export function encodeMessage(message: DanmakuMessage) {
  return `${marker}
\`\`\`json
${JSON.stringify(message)}
\`\`\``;
}

export function parseMessage(comment: GithubComment) {
  if (!comment.body?.startsWith(marker)) return null;
  const json = comment.body.match(/```json\s*([\s\S]*?)\s*```/)?.[1];
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as DanmakuMessage;
    if (parsed.schemaVersion !== 1 || parsed.kind !== "text") return null;
    return { ...parsed, id: String(comment.id), status: "confirmed" as const };
  } catch {
    return null;
  }
}

async function githubFetch<T>(path: string, init: RequestInit = {}) {
  const config = danmakuConfig();
  if (!config.token) {
    throw new Error("Missing GITHUB_DANMAKU_TOKEN");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text.slice(0, 240)}`);
  }

  return (await response.json()) as T;
}

export async function findDailyIssue(day: string) {
  const config = danmakuConfig();
  const query = new URLSearchParams({
    state: "open",
    per_page: "30",
  });
  const issues = await githubFetch<GithubIssue[]>(
    `/repos/${config.owner}/${config.repo}/issues?${query}`,
  );
  return issues.find((issue) => issue.title === dayIssueTitle(day)) ?? null;
}

export async function ensureDailyIssue(day: string) {
  const existing = await findDailyIssue(day);
  if (existing) return existing;

  const config = danmakuConfig();
  return githubFetch<GithubIssue>(`/repos/${config.owner}/${config.repo}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title: dayIssueTitle(day),
      body:
        "Daily GitHub danmaku archive. Comments in this issue are generated by Giggle Lab and use a machine-readable JSON block.",
    }),
  });
}

export async function listIssueMessages(day: string) {
  const config = danmakuConfig();
  const issue = await findDailyIssue(day);
  if (!issue) return [];

  const comments = await githubFetch<GithubComment[]>(
    `/repos/${config.owner}/${config.repo}/issues/${issue.number}/comments?per_page=100`,
  );
  return comments
    .map(parseMessage)
    .filter((message): message is DanmakuMessage => Boolean(message))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createIssueMessage(message: DanmakuMessage) {
  const config = danmakuConfig();
  const issue = await ensureDailyIssue(message.day);
  const comment = await githubFetch<GithubComment>(
    `/repos/${config.owner}/${config.repo}/issues/${issue.number}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body: encodeMessage(message) }),
    },
  );
  return {
    ...message,
    id: String(comment.id),
    status: "confirmed" as const,
  };
}
