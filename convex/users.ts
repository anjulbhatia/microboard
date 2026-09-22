import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
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

/** Claim or change a public handle. Usernames stay unique. */
export const setUsername = mutation({
  args: { userKey: v.optional(v.string()), username: v.string() },
  handler: async (ctx, args) => {
    const key = await userKey(ctx, args.userKey);
    const clean = args.username.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{2,23}$/.test(clean)) {
      throw new Error("Username needs 3-24 chars: lowercase, numbers, _ or -.");
    }
    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", clean))
      .unique();
    // A users row per userKey is out of scope until OTP; store the claim
    // on the caller's own row when it exists, else create it.
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
    const key = user.username ?? user.name ?? "";
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", key))
      .collect();
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
