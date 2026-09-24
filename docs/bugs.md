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
