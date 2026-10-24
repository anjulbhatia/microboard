import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import schema from "./schema";
import { now, userKey } from "./helpers";

/**
 * Create the user row for a new password account and return its id.
 * Called once per account, the first time the provider sees it.
 */
export const createUser = internalMutation({
  args: {
    provider: v.object({
      name: v.literal("password"),
      accountId: v.string(),
      profile: v.object({ username: v.string() }),
    }),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.provider.profile.username,
      username: args.provider.profile.username,
      createdAt: now(),
    });
  },
});

/**
 * Find the caller's users row. For @convex-dev/auth identities the subject
 * is the users row id; older/alternate subjects match via authSubject.
 */
async function callerRow(
  ctx: QueryCtx | MutationCtx,
  subject: string
): Promise<Doc<"users"> | null> {
  try {
    const byId = await ctx.db.get(subject as Id<"users">);
    if (byId) return byId;
  } catch {
    // Not an id-shaped subject — fall through to the authSubject index.
  }
  return await ctx.db
    .query("users")
    .withIndex("by_authSubject", (q) => q.eq("authSubject", subject))
    .unique();
}

function cleanHandle(raw: string): string {
  const clean = raw.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,23}$/.test(clean)) {
    throw new Error("Username needs 3-24 chars: lowercase, numbers, _ or -.");
  }
  return clean;
}

/**
 * Server-resolved identity for the caller. Null when signed out.
 * Frontend binds its session id to `subject` after sign-in so later
 * writes resolve to the same key the backend enforces.
 */
export const me = query({
  args: {},
  returns: v.union(
    v.object({ subject: v.string(), user: v.union(schema.doc("users"), v.null()) }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;
    return { subject: identity.subject, user: await callerRow(ctx, identity.subject) };
  },
});

/**
 * Find-or-create the caller's users row, bound to the auth subject.
 * Signed-in only. Idempotent — safe to call on every login.
 */
export const ensureMe = mutation({
  args: { username: v.optional(v.string()) },
  returns: schema.doc("users"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Sign in required.");
    const subject = identity.subject;
    const existing = await callerRow(ctx, subject);
    if (existing) {
      const patch: Partial<Doc<"users">> = {};
      if (!existing.authSubject) patch.authSubject = subject;
      if (args.username && !existing.username) {
        const clean = cleanHandle(args.username);
        const taken = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", clean))
          .unique();
        if (!taken) patch.username = clean;
      }
      if (Object.keys(patch).length > 0) await ctx.db.patch(existing._id, patch);
      return (await ctx.db.get(existing._id))!;
    }
    let username: string | undefined;
    if (args.username) {
      const clean = cleanHandle(args.username);
      const taken = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", clean))
        .unique();
      if (taken) throw new Error("Username taken.");
      username = clean;
    }
    const id = await ctx.db.insert("users", {
      name: username,
      username,
      authSubject: subject,
      createdAt: now(),
    });
    return (await ctx.db.get(id))!;
  },
});

/** Claim or change a public handle. Usernames stay unique. */
export const setUsername = mutation({
  args: { userKey: v.optional(v.string()), username: v.string() },
  handler: async (ctx, args) => {
    const clean = cleanHandle(args.username);
    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", clean))
      .unique();
    // Signed in: the handle lives on the subject-bound row — one row per
    // account, no duplicates on rename.
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject) {
      const mine = await callerRow(ctx, identity.subject);
      if (taken && taken._id !== mine?._id) throw new Error("Username taken.");
      if (mine) {
        await ctx.db.patch(mine._id, { username: clean, authSubject: identity.subject });
        return mine._id;
      }
      return await ctx.db.insert("users", {
        username: clean,
        authSubject: identity.subject,
        createdAt: now(),
      });
    }
    // Demo path: no subject, keep the caller-keyed claim row.
    const key = await userKey(ctx, args.userKey);
    const mine = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", key))
      .unique();
    if (taken && taken._id !== mine?._id) throw new Error("Username taken.");
    if (mine) {
      await ctx.db.patch(mine._id, { username: clean });
      return mine._id;
    }
    return await ctx.db.insert("users", { username: clean, createdAt: now() });
  },
});

/** Public lookup for u/[username]. Returns null when unknown. */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const byHandle = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (byHandle) return byHandle;
    return await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", args.username))
      .unique();
  },
});

/** Public profile: user plus their showcased boards with counts. */
export const profileBoards = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user =
      (await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .unique()) ??
      (await ctx.db
        .query("users")
        .withIndex("by_name", (q) => q.eq("name", args.username))
        .unique());
    if (!user) return null;
    // Owner ids are the users row id for signed-in writers, the claimed
    // handle for older/demo rows — fan out over every key and dedupe.
    const keys = [...new Set([user._id, user.username, user.name].filter((k) => k))];
    const lists = await Promise.all(
      keys.map((k) =>
        ctx.db
          .query("boards")
          .withIndex("by_owner", (q) => q.eq("ownerId", k!))
          .order("desc")
          .take(100)
      )
    );
    const seen = new Set<string>();
    const boards = lists
      .flat()
      .filter((b) => (seen.has(b._id) ? false : (seen.add(b._id), true)));
    return {
      user,
      boards: boards
        .filter((b) => b.showcase === true)
        .map((b) => ({
          publicId: b.publicId,
          title: b.title,
          version: b.version,
          updatedAt: b.updatedAt,
          likeCount: b.likeCount ?? 0,
          saveCount: b.saveCount ?? 0,
          commentCount: b.commentCount ?? 0,
          viewCount: b.viewCount ?? 0,
        })),
    };
  },
});
