# Bugs — red-team log

Living log. Each entry: what the attacker could do, where, severity, fix, commit.
Scope: `convex/` (backend) + `app/` (frontend). Auth posture is demo-grade by
design (see `docs/convex.md` §2–3): `userKey` = auth subject when signed in,
caller-passed demo id otherwise. Fixes below assume that model — they bind
writes to the *resolved* key, never the raw arg, and shrink anonymous blast
radius without breaking offline/demo flows.

| ID | Severity | Title |
|----|----------|-------|
| B1 | Critical | `boards.save`: owner-takeover + showcase hijack + unbounded snapshot |
| B2 | Critical | `boards.listByOwner`: any caller enumerates anyone's private boards |
| B3 | Critical | `subscribers.*`: PII leak + list poisoning, no email validation |
| B4 | Important | `listShowcase`: full-table scan + snapshot over-fetch |
| B5 | Important | `health.ping`: wall-clock in query breaks reactivity |
| B6 | Important | Email subject header injection + unbounded `sendBoardLink` blast |
| B7 | Important | App: unsafe snapshot parse + unbounded ingest payloads (DoS) |
| B8 | Important | `addComment`: username impersonation + stored-XSS hardening |

---

## B1 — `boards.save`: owner-takeover + showcase hijack + unbounded snapshot (Critical)

- **Where:** `convex/boards.ts` → `save`.
- **Exploit:** `ownerId` came from the client and was compared raw. Attacker
  passes victim's `ownerId` on an unowned board and claims it; passes their
  own `ownerId` to overwrite someone's unowned board; sets `showcase: true`
  on anyone's board to push it to the public gallery. `snapshot`/`title` had
  no size checks — a multi-MB snapshot burns quota or trips the 1MB doc
  limit mid-write.
- **Fix:** resolve the acting key server-side (`userKey(ctx, args.ownerId)` —
  auth subject wins when signed in), compare ownership against the resolved
  key, always persist the resolved key, gate `showcase: true` on ownership,
  validate title (1–120 chars), version (int ≥ 0), snapshot (non-empty,
  ≤ 900KB). Added `returns: v.id("boards")`.
- **Commit:** `fix(convex): harden boards.save ownership, showcase gate, size caps`

## B2 — `boards.listByOwner`: any caller enumerates anyone's private boards (Critical)

- **Where:** `convex/boards.ts` → `listByOwner`.
- **Exploit:** query took any `ownerId` and returned that owner's full rows
  (including non-showcase snapshots). Attacker paginates `ownerId`s and
  harvests private board JSON.
- **Fix:** resolve the caller key server-side and throw unless the requested
  `ownerId` equals it. Signed-in users can only list their own boards.
- **Commit:** `fix(convex): scope listByOwner to caller key`

## B3 — `subscribers.*`: PII leak + list poisoning, no email validation (Critical)

- **Where:** `convex/subscribers.ts` → `subscribe` / `unsubscribe` /
  `listByOwner`.
- **Exploit:** `listByOwner` returned anyone's email list for any `ownerId`
  (PII harvest). `subscribe` accepted any string as email with no cap —
  attacker stuffs a victim's list with junk (poisoning) or grows it
  unbounded to amplify `sendBoardLink` spam/cost.
- **Fix:** `listByOwner` now requires the resolved caller key to equal the
  requested `ownerId`. `subscribe`/`unsubscribe` stay public (visitors manage
  their own address) but validate format (regex, ≤ 254 chars, normalized
  lowercase) and `subscribe` caps lists at 2000 rows.
- **Commit:** `fix(convex): validate subscriber email, cap list, owner-only read`

## B4 — `listShowcase` / `showcase.feed`: full-table scan + snapshot over-fetch (Important)

- **Where:** `convex/boards.ts` → `listShowcase`, `convex/showcase.ts` →
  `feed`, index in `convex/schema.ts`.
- **Exploit/perf:** both read *every* board row then filtered in code —
  full-table scan that also loads private snapshots into memory and (for
  `listShowcase`) shipped them to the client. Table growth = slower
  queries, bigger bills, wider data exposure.
- **Fix:** new `by_showcase` composite index (`showcase`, `updatedAt`);
  both queries now hit the index, order desc, `take(limit ≤ 100)`.
  `listShowcase` projects lightweight card fields (no `snapshot`, no
  `ownerId`) and declares a `returns` validator.
- **Commit:** `fix(convex): index + bound showcase reads, project card fields`

## B5 — `health.ping`: wall-clock in query breaks reactivity (Important)

- **Where:** `convex/health.ts` → `ping`.
- **Exploit/perf:** `new Date().toISOString()` inside a query handler makes
  the result non-deterministic — Convex re-executes the query on every
  read, so pollers/load-balancer checks churn instead of caching.
- **Fix:** return a static `{ ok: true }` with a `returns` validator.
  Callers that need timing stamp on receipt.
- **Commit:** `fix(convex): static health ping, no clock in query`

## B6 — Email subject header injection + unbounded `sendBoardLink` blast (Important)

- **Where:** `app/features/agentmail/templates.ts` → `shareBoardTemplate`,
  `convex/mailing.ts` → `sendBoardLink` / `dispatchBatch`.
- **Exploit:** board titles flow into the mail `subject` raw — a title with
  `\r\n` injects extra mail headers (Bcc, Subject rewrite) via AgentMail.
  `sendBoardLink` accepted any `boardPublicId`/`boardTitle` and mailed the
  whole list with no cap — one call = unbounded send cost/spam.
- **Fix:** template strips CR/LF, trims, caps title at 120 chars (subject +
  body). Action validates `boardPublicId` (`[A-Za-z0-9_-]{1,128}`),
  sanitizes title, rejects empty lists and lists > 2000. `dispatchBatch`
  re-checks the batch bounds and declares `returns: v.null()`.
- **Commit:** `fix(mail): sanitize board title subject, bound send blast`
