import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const PRIMARY_HOST = "giggle-lab.mowtwo.com";
const REDIRECT_HOSTS = new Set(["giggle-lab.vercel.app"]);
const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];

  if (host && REDIRECT_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.hostname = PRIMARY_HOST;
    url.protocol = "https:";

    return NextResponse.redirect(url, 308);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
