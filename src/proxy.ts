import { NextResponse, type NextRequest } from "next/server";

const PRIMARY_HOST = "giggle-lab.mowtwo.com";
const REDIRECT_HOSTS = new Set(["giggle-lab.vercel.app"]);

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];

  if (!host || !REDIRECT_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.hostname = PRIMARY_HOST;
  url.protocol = "https:";

  return NextResponse.redirect(url, 308);
}
