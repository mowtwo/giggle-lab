# Giggle Lab

Giggle Lab is a shelf of browser-first toy apps built with Next.js. The project
leans into playful UI, local-first browser APIs, and small experiments that are
useful enough to try but not serious enough to become products.

Live site: https://giggle-lab.mowtwo.com

Source: https://github.com/mowtwo/giggle-lab

## Featured App

The current featured app is **GitHub Timeline Danmaku**.

- Users sign in with GitHub OAuth.
- Messages are plain-text danmaku with GitHub nickname, avatar, and profile URL.
- The playback stage uses a 24-hour local-time timeline.
- Future time is visible but disabled; the playable range grows with real time.
- Seeking backward starts replay from that point and then advances forward.
- New messages jump to the real current time and appear immediately from the
  right edge.
- The storage backend is GitHub Issues in a public repository:
  https://github.com/mowtwo/giggle-lab-danmu

The stored comment payload is versioned JSON with `kind`, `schemaVersion`, and
`extensions`, so richer formats can be added without breaking existing text
messages.

## Apps

- GitHub Timeline Danmaku: GitHub-login text danmaku backed by issue comments.
- Mini Office Web: browser-only PDF/DOCX/XLSX/PPTX preview with practical PDF
  export.
- Magic Camera: MediaPipe hand tracking plus Three.js camera effects.
- QR File Beam: split small files into QR frames and scan them back.
- GIF Editor: GIF/WebM trimming, chroma-key background removal, and export.
- Heart Block Editor: editable heart-shaped poster blocks.
- Minesweeper and Island Juice Sort: small game experiments.
- Power-on Detector: a deliberately unnecessary device-state joke.

## Technical Details

### Framework

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- `next-intl` for zh/en routes
- `animal-island-ui` for the Animal Crossing-inspired controls and theme

Routes live under `src/app/[locale]`, shared app metadata lives in
`src/lib/apps.ts`, and translations live in `messages/en.json` and
`messages/zh.json`.

### GitHub Danmaku Architecture

- `src/app/[locale]/github-danmaku`: the client playback UI.
- `src/app/api/github-danmaku/auth/*`: GitHub OAuth start/callback/logout.
- `src/app/api/github-danmaku/me`: session and config inspection.
- `src/app/api/github-danmaku/messages`: day-based read/write API.
- GitHub OAuth is used only for user identity.
- Server-side Vercel functions write to GitHub Issues with a token stored in
  Vercel environment variables.
- One issue is used per local day: `[danmaku] YYYY-MM-DD`.
- Each issue comment contains a machine-readable JSON block.
- Client-side pending messages are cached in `localStorage` and displayed before
  GitHub confirms the write.
- Sync is intentionally low-frequency by default to stay friendly to GitHub API
  rate limits.

Required production env:

```env
GITHUB_DANMAKU_CLIENT_ID=
GITHUB_DANMAKU_CLIENT_SECRET=
GITHUB_DANMAKU_SESSION_SECRET=
GITHUB_DANMAKU_TOKEN=
GITHUB_DANMAKU_OWNER=mowtwo
GITHUB_DANMAKU_REPO=giggle-lab-danmu
```

### Mini Office Web

- PDF: `pdfjs-dist`, canvas rendering, CMap/standard font assets under
  `public/pdfjs`, PDF source export through `pdf-lib`.
- DOCX: `docx-preview` with `mammoth` fallback.
- XLSX: dynamic `xlsx`, dense parsing, cached formula results, capped preview.
- PPTX: dynamic `jszip` OOXML parser for slide text/images/layout backgrounds.
- DOM-to-PDF export uses `html2canvas` and `jspdf`.
- Heavy format libraries are loaded dynamically by file type.

### Magic Camera

- MediaPipe Tasks Vision for hand landmark tracking.
- Three.js for the particle scene.
- Camera mirroring, two-hand tracking, and gesture-triggered effects are handled
  in the browser.

### Deployment

The production site runs on Vercel. The primary host is
`giggle-lab.mowtwo.com`; `giggle-lab.vercel.app` is redirected by the project
proxy configuration.

## Development

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000` or the port printed by Next.js.

Useful scripts:

```sh
pnpm dev
pnpm lint
pnpm build
pnpm start
```

Use `pnpm` consistently; the repository includes `pnpm-lock.yaml` and
`pnpm-workspace.yaml`.

