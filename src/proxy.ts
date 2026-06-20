import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const PRIMARY_HOST = "giggle-lab.mowtwo.com";
const REDIRECT_HOSTS = new Set(["giggle-lab.vercel.app"]);
const LOCALE_HEADER_NAME = "X-NEXT-INTL-LOCALE";
const handleI18nRouting = createMiddleware(routing);

function hasLocalePrefix(pathname: string) {
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

function hasDefaultLocalePrefix(pathname: string) {
  const prefix = `/${routing.defaultLocale}`;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function continueWithLocale(request: NextRequest, locale: string) {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER_NAME, locale);

  const response = NextResponse.next({
    request: {
      headers,
    },
  });
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
  });

  return response;
}

function redirectToDefaultLocale(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname =
    request.nextUrl.pathname === "/"
      ? `/${routing.defaultLocale}`
      : `/${routing.defaultLocale}${request.nextUrl.pathname}`;

  return NextResponse.redirect(url, 307);
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];

  if (host && REDIRECT_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.hostname = PRIMARY_HOST;
    url.protocol = "https:";

    return NextResponse.redirect(url, 308);
  }

  if (hasDefaultLocalePrefix(request.nextUrl.pathname)) {
    return continueWithLocale(request, routing.defaultLocale);
  }

  if (!hasLocalePrefix(request.nextUrl.pathname)) {
    return redirectToDefaultLocale(request);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
