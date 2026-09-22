# Convex backend — schema, routes, share seam

> Living doc. Covers the backend half of Step 1 (commits `5dbfe4c`,
> `11dcfc0`, `c12b8bf`, `34722e3`). Frontend grid logic lives in code
> (`app/features/board/types.ts`, `app/store/board.ts`); data-layer ops
> live in `docs/logics.md`.

## 1. Schema (`convex/schema.ts`)

```ts
users:  { name?, username?, image?, createdAt? }
        indexes: by_name, by_username
boards: { publicId, ownerId?, title, snapshot, version, showcase?,
          likeCount?, saveCount?, commentCount?, viewCount?,
          createdAt, updatedAt }
        indexes: by_publicId, by_owner
links:  { slug, boardId, createdAt } index: by_slug
subscribers: { ownerId, email, createdAt } index: by_owner
boardLikes / boardSaves: { boardId, userKey, createdAt }
        indexes: by_board, by_user_board
boardComments: { boardId, userKey, username?, text, createdAt }
        index: by_board
mailInboxes: { ownerId, inboxId, createdAt } index: by_owner
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

| Function | Kind | Notes |
| -------- | ---- | ----- |
| `save` | mutation | Upsert on `by_publicId`. Patches `updatedAt`. Throws `"Not your board."` when the stored row has an `ownerId` that differs from the caller. Preserves existing `ownerId`/`showcase` when the caller omits them. |
| `getByPublicId` | query | Public read for `/share/:id`. No owner check — shared links are public by design. |
| `listByOwner` | query | Powers `/home` (user's boards) via `by_owner`. |
| `listShowcase` | query | Flags `showcase === true` in code. Add a `by_showcase` index when the table grows. |
| `toggleShowcase` | mutation | Owner flips the flag. Returns the new value. |
| `removeBoard` | mutation | Owner delete with likes/saves/comments/links cleanup. |
| `recordView` | mutation | Public view ping, no auth. |
| `toggleLike` / `toggleSave` | mutation | Returns `{ liked, likeCount }` / `{ saved, saveCount }`. |
| `savedBoards` | query | Boards a user saved, newest first. |
| `addComment` / `listComments` / `removeComment` | mutation/query/mutation | 500-char cap; own or board-owner delete with counter fix. |
| `showcase.feed` | query | Public feed newest-first with author + counts + viewer flags. |
| `showcase.boardDetail` | query | Board + comments + liked/saved flags for `/share/:id`. |
| `users.setUsername` | mutation | Unique handle claim. |
| `users.getByUsername` / `users.profileBoards` | query | Public lookup for `u/[username]`. |
| `subscribers.subscribe/unsubscribe/listByOwner` | mutation/mutation/query | Mailing list per owner. |
| `mailing.sendBoardLink` | action | Mails the board link to every subscriber via the owner's AgentMail inbox. Needs `AGENTMAIL_API_KEY`. |

Security posture today: ownership is enforced by comparing the passed
`ownerId` string. This is a demo-grade trust boundary — the client tells
the truth. Real enforcement (`ctx.auth.getUserIdentity()` + row check)
lands with email OTP.

## 3. Auth: password live, demo fallback, OTP next

- **Backend live (local).** `npx convex dev` serves `127.0.0.1:3210`
  (URL in gitignored `.env.local`). Auth keys generated once and set via
  `convex env set`. Hosted deploy needs `npx convex login` (browser) + push.
- **Password accounts live.** `ConvexLogin` (username + password, sign
  in/up tabs) via `useSignInWithPassword` / `useSignUpWithPassword`;
  `linkRemote` marks the local session `demo:false` (`remote-<name>` id).
  `AuthGate` passes on Convex session or demo session.
- **Demo fallback.** No `VITE_CONVEX_URL` → fully offline; username-only
  modal with stable `demo-<uuid>` id.
- **Identity convention.** Functions key people by userKey = auth subject
  when signed in, demo id otherwise (`convex/helpers.ts userKey`). Harden
  with `ctx.auth` checks once OTP lands.
- **Next — email OTP via AgentMail.** Same `users` row; no schema change.
- **Later — Google SSO.** Another provider on the same core.

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
- Grid is one fluid canvas: **8 cols × 5 rows = 40 cells** (`BOARD_GRID`).
  Presentation scales to screen. Store clamps every widget
  with `clampWidgetToGrid`; `useBoardDerived` exposes `overCapacity` when
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
