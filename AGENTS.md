# Repository Guidelines

## Project Structure & Module Organization

Giggle Lab is a Next.js App Router project for small web apps. Routes live in `src/app`, with localized pages under `src/app/[locale]`. Each mini app should have its own route directory, for example `src/app/[locale]/minesweeper`, and should keep route-specific components and helpers nearby. Shared UI belongs in `src/components`, shared app metadata in `src/lib/apps.ts`, and i18n helpers in `src/i18n`. Translation messages are stored in `messages/en.json` and `messages/zh.json`. Static assets belong in `public`.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies from `pnpm-lock.yaml`.
- `pnpm dev`: start the local Next.js development server.
- `pnpm build`: create a production build and run Next.js type checks.
- `pnpm start`: serve the production build locally after `pnpm build`.
- `pnpm lint`: run ESLint with Next.js Core Web Vitals and TypeScript rules.

Use `pnpm` consistently; this repository includes `pnpm-workspace.yaml` and a pnpm lockfile.

## Coding Style & Naming Conventions

Write TypeScript and React function components. Keep strict TypeScript clean and use the `@/*` path alias for imports from `src`. Use lowercase kebab-case for route folders such as `qr-file-beam`, and descriptive file names like `game-logic.ts` or `device-detection.ts`. Prefer colocating mini-app logic with its route unless it is reused across apps.

Follow the existing formatting style: two-space indentation, double quotes, semicolons, and concise named exports. Global styling lives in `src/app/globals.css`; keep component styling aligned with the existing Tailwind and `animal-island-ui` visual language.

## Testing Guidelines

There is no dedicated test runner configured yet. Before opening a PR, run `pnpm lint` and `pnpm build`. For changes to game or protocol logic, add focused tests when introducing a test framework, or document manual verification steps in the PR. Test files should sit near the code they cover and use clear names such as `game-logic.test.ts`.

## Commit & Pull Request Guidelines

Commit history uses short imperative subjects, for example `Add QR file beam tool`, `Fix qr-file-beam layout after file selection`, and `Improve qr-file-beam scan hit rate`. Keep commits scoped to one change.

Pull requests should include a concise description, linked issue if applicable, and screenshots or screen recordings for UI changes. Mention any affected locales and update both `messages/en.json` and `messages/zh.json` when adding visible text.

## Agent-Specific Instructions

Do not overwrite unrelated work in the repository. When adding a new mini app, create its localized route under `src/app/[locale]`, add its listing to `src/lib/apps.ts`, and include translations for all supported locales.
