import { NextResponse } from "next/server";

import { createState, danmakuConfig, setStateCookie } from "../../lib";

export async function GET(request: Request) {
  const config = danmakuConfig();
  if (!config.clientId || !config.clientSecret || !config.sessionSecret) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/github-danmaku";
  const state = createState();
  await setStateCookie(`${state}:${returnTo}`);

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("scope", "read:user");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl);
}

