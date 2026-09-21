# Convex backend — schema, routes, share seam

> Living doc. Covers the backend half of Step 1 (commits `5dbfe4c`,
> `11dcfc0`, `c12b8bf`, `34722e3`). Frontend grid logic lives in code
> (`app/features/board/types.ts`, `app/store/board.ts`); data-layer ops
> live in `docs/logics.md`.

## 1. Schema (`convex/schema.ts`)

```ts
users:  { name?: string, createdAt?: string }
boards: { publicId: string, ownerId?: string, title: string,
          snapshot: string, version: number, showcase?: boolean,
          createdAt: string, updatedAt: string }
        indexes: by_publicId [publicId], by_owner [ownerId]
links:  { slug: string, boardId: Id<boards>, createdAt: string }
        index: by_slug [slug]
```

Decisions:

- **Boards live in their own table, not embedded in users.** Separate +
  `ownerId` won over embed-in-user: share/showcase queries never load
  private docs, and one user can own many boards without hitting doc
  limits.
- **`ownerId` is the users row id as a string, optional for now.** Optional
  keeps local/demo boards working before auth lands. Once email OTP is in,
  make it required and enforce `ctx.auth` in every function.
- **`snapshot` is the versioned board JSON as a string.** Single source of
  truth on both sides; the client replays it with `JSON.parse` (see §5).
- **`showcase` is a flag on boards today**, not a separate table. A
  dedicated `showcase` / `sharedBoards` table comes in Step 2 if curation
  (ordering, featured, blurbs) is needed.

## 2. Board functions (`convex/boards.ts`)

| Function | Kind | Args | Notes |
| -------- | ---- | ---- | ----- |
| `save` | mutation | `publicId, ownerId?, title, snapshot, version, showcase?` | Upsert on `by_publicId`. Patches `updatedAt`. Throws `"Not your board."` when the stored row has an `ownerId` that differs from the caller. Preserves existing `ownerId`/`showcase` when the caller omits them. |
| `getByPublicId` | query | `publicId` | Public read for `/share/:id`. No owner check — shared links are public by design. |
| `listByOwner` | query | `ownerId` | Powers `/home` (user's boards) via `by_owner`. |
| `listShowcase` | query | — | Filters `showcase === true` in code. Add a `by_showcase` index when the table grows. |

Security posture today: ownership is enforced by comparing the passed
`ownerId` string. This is a demo-grade trust boundary — the client tells
the truth. Real enforcement (`ctx.auth.getUserIdentity()` + row check)
lands with email OTP.

## 3. Auth: demo now, email OTP next

- **Today — demo session (frontend).** `app/store/session.ts` provisions a
  stable id (`demo-<uuid>`, persisted in `localStorage` under
  `microboard.demoId`). That id is passed as `ownerId` so boards already
  scope to a user before real auth exists.
- **Today — password core (backend).** `convex/auth.ts` wires
  `@convex-dev/auth` core + username/password provider; `convex/users.ts`
  `createUser` stores `{ name, createdAt }` on first login.
- **Next — email OTP via AgentMail.** Same `users` row: OTP identity
  attaches to the existing row, demo `ownerId`s migrate by matching the
  demo id stored at sign-up. No schema change needed.
- **Later — Google SSO.** Another provider on the same core; again no
  schema change.

## 4. Routes (`app/App.tsx`)

| Route | Page | Access |
| ----- | ---- | ------ |
| `/` | Landing | public |
| `/create` (`/new` planned) | Canvas | demo user and up |
| `/dashboard` (`/home` planned) | User's boards via `listByOwner` | owner |
| `/showcase` | Gallery via `listShowcase` | public |
| `/share/:id` | Shared board via `getByPublicId` | public (link) |
| `/b/:id` | Redirect → `/share/:id` | compat for old links |
| `/u/:id` | Public profile | planned Step 2 |

Canonical share URL is built by `publicBoardUrl()` in
`app/features/share/types.ts` → `${origin}/share/${publicId}`.

## 5. Board snapshot contract (what `snapshot` holds)

The JSON the client serializes with `boardSnapshot(board)`:

- `Widget { id, type, title, col, row, w, h, dataX?, dataY?, props? }`.
  `col/row` are 0-based grid cells; `col + w <= cols` always.
  `x/y` (legacy data-column names) still parse — readers prefer
  `dataX/dataY` via `widgetDataX/Y()`, old snapshots normalize on load.
- Grid is **16 cols × 10 rows, 160-cell capacity** (`BOARD_GRID`).
  `3:4` portrait is 10×16 (same 160 cells). Store clamps every widget
  with `clampWidgetToGrid`; `clampAllWidgets(cols)` re-clamps on ratio
  change; `useBoardDerived` exposes `overCapacity` when
  `usedCells > capacity`.
- Mobile rule: order array is reading order; small screens stack in
  `order` sequence (position ignored, size becomes full-width). Desktop
  enforces strict clamp.

## 6. Share seam (`app/features/share/`)

`useShare().publish()` is the single publish entry point:

- No `VITE_CONVEX_URL` → resolves a `local` result
  (`{ publicId: board.id, url: publicBoardUrl(board.id) }`).
- `VITE_CONVEX_URL` set → slot for `convex/react` dynamic import calling
  `api.boards.save` with `boardSnapshot(board)` (throws "not wired yet"
  until that import lands — that is the next backend step).
- Never statically import `convex/*` from `app/` (see `app/lib/backend.ts`);
  static imports break the build before `convex` is installed.

Share dropdown targets (Step 2): Copy URL · Add to showcase (`showcase:
true` via `save`) · Download JPG/PDF/JSON · Print · Send to subscriber
list (AgentMail). Firecrawl options deferred.

## 7. Next (Step 2 gates)

1. Wire `useShare` to `api.boards.save` with the demo `ownerId`.
2. Require `ownerId` + `ctx.auth` checks once OTP lands.
3. Decide: `showcase` stays a flag vs. new `showcase` table; add
   `subscribers` (mailing list) and `sharedBoards` tables when
   AgentMail send lands.
4. API data sources with auto-refresh (schema + polling live in
   `docs/logics.md` when built).
