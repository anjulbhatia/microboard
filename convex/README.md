# Convex backend — accommodation (draft, not wired)

> Status: **scaffold only**. No `convex` package installed, no client wired.
> Your job: `npm i convex`, `npx convex dev`, paste drafts, set `VITE_CONVEX_URL`.

## Layout decision

Modern format, not a `backend/ frontend/` clique split:

```text
microboard/
├── convex/               # backend — you own this
│   ├── README.md         # this file
│   ├── schema.ts         # draft tables
│   ├── boards.ts         # draft mutations/queries
│   └── showcase.ts       # draft gallery query
└── app/
    ├── app/              # shell, routes, stores
    ├── features/         # board, widgets, data, share, landing…
    └── shared/           # ui, charts, lib, providers
```

Why: Convex convention is root `convex/`; `app/app|features|shared`
already matches. A clique split would rewrite every `@/...` import for
zero gain.

## Your setup steps

1. `npm i convex`
2. `npx convex dev` — generates `convex/_generated/` (gitignored)
3. Copy `schema.ts` draft below into the real file, adjust
4. Copy `boards.ts` / `showcase.ts` drafts, adjust
5. Copy `.env.example` → `.env.local`, set `VITE_CONVEX_URL`
6. Frontend seam is ready at `app/features/share/` + `app/app/lib/backend.ts` —
   it stays local until `VITE_CONVEX_URL` exists, then dynamic-imports
   `convex/react` (never statically imported, so builds pass without it)

## Contract (frontend ↔ backend)

- Publish: `Board` JSON → `boards.save` → `{ publicId }` → `/b/:publicId`
- Load: `/b/:publicId` → `boards.get` → same `Board` JSON (versioned, replayable)
- Showcase: `showcase.list` → recent public boards (title, version, updatedAt)
- Board stays source of truth in Zustand; Convex is share + gallery only
