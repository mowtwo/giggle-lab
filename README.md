# Giggle Lab

一个用来收纳搞笑网页小应用的 Next.js 项目壳子。

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Radix UI primitives
- shadcn/ui style components
- lucide-react icons
- Animal Island inspired theme tokens

## Development

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Project Shape

- `src/app` - routes, layout, and pages
- `src/components` - shared UI and feature components
- `src/components/ui` - shadcn-style primitives
- `src/lib` - utilities and app data

## Scripts

```sh
pnpm dev
pnpm build
pnpm lint
```

## Notes

The starter page is a small gallery shell. Add each mini app as its own route
under `src/app`, then list it in `src/lib/apps.ts`.

The visual theme is based on the public `animal-island-ui` design language:
warm parchment surfaces, rounded organic cards, mint/yellow accents, and
game-button press shadows.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
