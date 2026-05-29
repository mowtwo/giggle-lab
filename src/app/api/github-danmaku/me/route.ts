import { NextResponse } from "next/server";

import { danmakuConfig, getSessionUser, missingConfig } from "../lib";

export async function GET() {
  const config = danmakuConfig();
  const user = await getSessionUser();
  return NextResponse.json({
    user,
    config: {
      repo: `${config.owner}/${config.repo}`,
      missing: missingConfig(),
      syncIntervalSeconds: 300,
    },
  });
}

