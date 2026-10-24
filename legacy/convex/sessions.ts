import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { now, userKey } from "./helpers";

/**
 * Sessions: persistent client presence acknowledged by the backend.
 * The client heartbeats with its stable sessionId; the server upserts
 * the row and returns server time as the ack. Auth subject wins over
 * the passed userKey when signed in (no impersonation).
 */

const SESSION_TTL_MS = 120_000;

const sessionIdValidator = v.string();
const usernameValidator = v.optional(v.string());
const boardPublicIdValidator = v.optional(v.string());

const sessionValidator = v.object({
  sessionId: v.string(),
  userKey: v.string(),
  username: v.optional(v.string()),
  boardPublicId: v.optional(v.string()),
  lastSeen: v.number(),
  createdAt: v.string(),
});

function cleanSessionId(raw: string): string {
  const id = raw.trim().slice(0, 128);
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("Bad session id.");
  return id;
}

/** Upsert presence, return the ack. Idempotent — StrictMode-safe. */
export const heartbeat = mutation({
  args: {
    sessionId: sessionIdValidator,
    userKey: v.optional(v.string()),
    username: usernameValidator,
    boardPublicId: boardPublicIdValidator,
  },
  returns: v.object({
    ok: v.literal(true),
    sessionId: v.string(),
    serverTime: v.number(),
  }),
  handler: async (ctx, args) => {
    const sessionId = cleanSessionId(args.sessionId);
    const key = await userKey(ctx, args.userKey);
    const username = (args.username ?? "").trim().slice(0, 32) || undefined;
    const boardPublicId = args.boardPublicId?.trim().slice(0, 128) || undefined;
    const serverTime = Date.now();
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        userKey: key,
        username,
        boardPublicId,
        lastSeen: serverTime,
      });
    } else {
      await ctx.db.insert("sessions", {
        sessionId,
        userKey: key,
        username,
        boardPublicId,
        lastSeen: serverTime,
        createdAt: now(),
      });
    }
    return { ok: true as const, sessionId, serverTime };
  },
});

/** Read back one acknowledged session. */
export const get = query({
  args: { sessionId: sessionIdValidator },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId.trim().slice(0, 128)))
      .unique();
    if (!row) return null;
    const { _id, _creationTime, ...rest } = row;
    void _id;
    void _creationTime;
    return rest;
  },
});

/**
 * Sessions seen within TTL. Client passes nowMs — queries never read
 * the wall clock (reactivity). Bounded take(50), caller-scoped.
 */
export const listActive = query({
  args: { userKey: v.optional(v.string()), nowMs: v.number() },
  returns: v.array(sessionValidator),
  handler: async (ctx, args) => {
    const key = await userKey(ctx, args.userKey);
    const cutoff = args.nowMs - SESSION_TTL_MS;
    const rows = await ctx.db
      .query("sessions")
      .withIndex("by_userKey", (q) => q.eq("userKey", key))
      .order("desc")
      .take(50);
    return rows
      .filter((r) => r.lastSeen >= cutoff)
      .map(({ _id, _creationTime, ...rest }) => {
        void _id;
        void _creationTime;
        return rest;
      });
  },
});
