# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — start the Next.js dev server (default `http://localhost:3000`).
- `pnpm build` — production build; also runs Next.js type checks.
- `pnpm start` — serve the production build (after `pnpm build`).
- `pnpm lint` — ESLint (Next Core Web Vitals + TypeScript rules).

Use `pnpm` only — the repo has `pnpm-workspace.yaml` and a pnpm lockfile. There is no test runner configured; rely on `pnpm lint` and `pnpm build` for verification, and document manual steps in PRs.

## Architecture

This is a Next.js App Router gallery shell that hosts independent mini-apps. The "big picture" pieces a new contributor needs to know:

### Mini-app pattern

Every mini-app is registered in two places:

1. A route directory under `src/app/[locale]/<kebab-slug>/` containing its `page.tsx` and any colocated logic (e.g. `game-logic.ts`, `protocol.ts`). Keep app-specific code colocated; only promote to `src/components` or `src/lib` when reused across apps.
2. An entry appended to the `miniApps` array in `src/lib/apps.ts` — the gallery home page reads this to render `AppCard`s. The entry uses `titleKey`/`summaryKey` that resolve through next-intl, plus an `animal-island-ui` `IconName` and a named color token.

When adding a mini-app, you must also add its `titleKey` and `summaryKey` strings to **both** `messages/en.json` and `messages/zh.json`. Missing a locale will surface as a runtime error in that locale.

### Internationalization

- `next-intl` drives routing and translation. Locales: `zh` (default) and `en`, configured in `src/i18n/routing.ts` with `localePrefix: "as-needed"` (default locale has no prefix in the URL).
- All app routes live under `src/app/[locale]/...`. The locale layout (`src/app/[locale]/layout.tsx`) wraps children in `NextIntlClientProvider`.
- Use the typed navigation helpers from `src/i18n/navigation.ts` (`Link`, `useRouter`, `usePathname`, `redirect`) instead of importing directly from `next/link` or `next/navigation` — they preserve the active locale.
- Message loading happens in `src/i18n/request.ts`.

### Middleware (named `proxy.ts`, not `middleware.ts`)

The Next.js middleware is at `src/proxy.ts` and exports a `proxy` function (Next 16's renamed middleware convention). It does two jobs in order:

1. 308-redirects requests from `giggle-lab.vercel.app` to the primary host `giggle-lab.mowtwo.com`.
2. Delegates everything else to the `next-intl` middleware for locale routing.

If you add behavior here, preserve both responsibilities and keep the `config.matcher` excluding `api`, `trpc`, `_next`, `_vercel`, and asset paths.

### UI / design system

- Visual language comes from the `animal-island-ui` npm package (parchment surfaces, mint/yellow accents, game-button shadows) plus Tailwind v4 (`@tailwindcss/postcss`). Global tokens are in `src/app/globals.css`.
- `components.json` indicates shadcn-style primitives are expected under `src/components/ui/`, but that directory is currently empty — new shared primitives can be added there.
- `src/components/navigation-provider.tsx` wraps pages with shared navigation/layout chrome.

### Path alias

`@/*` resolves to `src/*` (see `tsconfig.json`). Prefer it over relative imports across feature boundaries.

## Conventions worth knowing

- Route folders and TS files use lowercase kebab-case (`qr-file-beam`, `game-logic.ts`).
- Formatting: two-space indent, double quotes, semicolons, named exports.
- Commit subjects are short and imperative (e.g. `Add QR file beam tool`, `Fix qr-file-beam layout after file selection`); keep commits scoped to one change.
- When adding visible UI text, update **both** locale files in the same change.
