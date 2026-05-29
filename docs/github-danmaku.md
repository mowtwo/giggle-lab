# GitHub Timeline Danmaku

## Storage Model

- One public GitHub issue per local day: `[danmaku] YYYY-MM-DD`.
- Each message is a GitHub issue comment with a stable marker and JSON payload.
- Current payload supports plain text only, but keeps `kind`, `schemaVersion`,
  and `extensions` fields so richer formats can be added later.
- The browser syncs only the current local day by default.
- Sending is optimistic: the message is displayed from local cache first, then
  confirmed after the server writes to GitHub.

## Required Environment Variables

- `GITHUB_DANMAKU_CLIENT_ID`: GitHub OAuth App client id.
- `GITHUB_DANMAKU_CLIENT_SECRET`: GitHub OAuth App client secret.
- `GITHUB_DANMAKU_SESSION_SECRET`: random secret for signing the httpOnly
  session cookie.
- `GITHUB_DANMAKU_TOKEN`: fine-grained token or GitHub App token with Issues
  read/write access to the storage repository.

Optional:

- `GITHUB_DANMAKU_OWNER`: defaults to `mowtwo`.
- `GITHUB_DANMAKU_REPO`: defaults to `giggle-lab`.

## OAuth Callback

Configure the GitHub OAuth App callback URL to:

`https://<production-domain>/api/github-danmaku/auth/callback`

For local testing:

`http://localhost:3030/api/github-danmaku/auth/callback`

## Cost and Rate Notes

This is designed for low-volume side-project traffic:

- Client polling interval is 5 minutes.
- The API fetches one day's issue comments at a time.
- The server rate-limits each logged-in user to 6 sends per minute in memory.
- GitHub stores the archive in public Issues, so there is no database bill.
- Vercel server-side proxy usage should stay in free/Hobby territory for normal
  toy-app usage, but high traffic can still hit provider limits.

