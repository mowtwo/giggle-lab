import { NextResponse } from "next/server";

import {
  consumeStateCookie,
  danmakuConfig,
  setSessionCookie,
  type GithubDanmakuUser,
} from "../../lib";

type GithubTokenResponse = {
  access_token?: string;
  error?: string;
};

type GithubUserResponse = {
  id: number;
  login: string;
  name?: string | null;
  avatar_url: string;
  html_url: string;
};

export async function GET(request: Request) {
  const config = danmakuConfig();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stored = await consumeStateCookie();
  const [expectedState, returnTo = "/github-danmaku"] = stored?.split(":") ?? [];

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL("/github-danmaku?auth=failed", url));
  }

  if (!config.clientId || !config.clientSecret) {
    return NextResponse.redirect(new URL("/github-danmaku?auth=missing", url));
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
  });
  const token = (await tokenResponse.json()) as GithubTokenResponse;
  if (!token.access_token || token.error) {
    return NextResponse.redirect(new URL("/github-danmaku?auth=denied", url));
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.access_token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const githubUser = (await userResponse.json()) as GithubUserResponse;
  const user: GithubDanmakuUser = {
    id: githubUser.id,
    login: githubUser.login,
    name: githubUser.name || githubUser.login,
    avatarUrl: githubUser.avatar_url,
    htmlUrl: githubUser.html_url,
  };
  await setSessionCookie(user);

  return NextResponse.redirect(new URL(returnTo, url));
}

