import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { now, userKey } from "./helpers";

/**
 * Boards: owner snapshots plus showcase engagement.
 * userKey = auth subject when signed in, demo id otherwise.
 */

async function boardOrThrow(ctx: MutationCtx, publicId: string) {
  const board = await ctx.db
    .query("boards")
    .withIndex("by_publicId", (q) => q.eq("publicId", publicId))
    .unique();
  if (!board) throw new Error("Board not found.");
  return board;
}

export const save = mutation({
  args: {
    publicId: v.string(),
    ownerId: v.optional(v.string()),
    title: v.string(),
    snapshot: v.string(),
    version: v.number(),
    showcase: v.optional(v.boolean()),
  },
  returns: v.id("boards"),
  handler: async (ctx, args) => {
    const at = now();
    // Act as the resolved caller — auth subject wins when signed in, so a
    // spoofed ownerId arg cannot impersonate anyone with a real session.
    const key = await userKey(ctx, args.ownerId);
    const title = args.title.trim().slice(0, 120);
    if (!title) throw new Error("Title is empty.");
    if (!Number.isInteger(args.version) || args.version < 0) {
      throw new Error("Version must be a non-negative integer.");
    }
    if (args.snapshot.length === 0 || args.snapshot.length > 900_000) {
      throw new Error("Snapshot is empty or too large (max ~900KB).");
    }
    const existing = await ctx.db
      .query("boards")
      .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
      .unique();
    // Flipping someone else's board into the public gallery is a write —
    // require ownership for showcase: true.
    if (args.showcase === true) {
      const owner = existing?.ownerId ?? key;
      if (owner !== key) throw new Error("Not your board.");
    }
    if (existing) {
      if (existing.ownerId !== undefined && existing.ownerId !== key) {
        throw new Error("Not your board.");
      }
      await ctx.db.patch(existing._id, {
        ownerId: key,
        title,
        snapshot: args.snapshot,
        version: args.version,
        showcase: args.showcase ?? existing.showcase,
        updatedAt: at,
      });
      return existing._id;
    }
    return await ctx.db.insert("boards", {
      publicId: args.publicId,
      ownerId: key,
      title,
      snapshot: args.snapshot,
      version: args.version,
      showcase: args.showcase,
      createdAt: at,
      updatedAt: at,
    });
  },
});

export const getByPublicId = query({
  args: { publicId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boards")
      .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
      .unique();
  },
});

export const listByOwner = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

export const listShowcase = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("boards").collect();
    return all.filter((b) => b.showcase === true);
  },
});

/** Owner delete with engagement cleanup. Returns true when removed. */
export const removeBoard = mutation({
  args: { publicId: v.string(), ownerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const board = await boardOrThrow(ctx, args.publicId);
    // Boards saved without an owner stay manageable by anyone holding
    // the link; owned boards need the matching key.
    if (board.ownerId !== undefined) {
      const key = await userKey(ctx, args.ownerId);
      if (board.ownerId !== key) throw new Error("Not your board.");
    }
    const tables = ["boardLikes", "boardSaves", "boardComments"] as const;
    for (const t of tables) {
      const rows = await ctx.db
        .query(t)
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }
    const links = await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", board.publicId))
      .collect();
    for (const l of links) await ctx.db.delete(l._id);
    await ctx.db.delete(board._id);
    return true;
  },
});

/** Owner flips the showcase flag. Returns the new value. */
export const toggleShowcase = mutation({
  args: { publicId: v.string(), ownerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const board = await boardOrThrow(ctx, args.publicId);
    if (board.ownerId !== undefined) {
      const key = await userKey(ctx, args.ownerId);
      if (board.ownerId !== key) throw new Error("Not your board.");
    }
    const next = !(board.showcase === true);
    await ctx.db.patch(board._id, { showcase: next, updatedAt: now() });
    return next;
  },
});

/** Public view ping. No auth needed. */
export const recordView = mutation({
  args: { publicId: v.string() },
  handler: async (ctx, args) => {
    const board = await boardOrThrow(ctx, args.publicId);
    await ctx.db.patch(board._id, { viewCount: (board.viewCount ?? 0) + 1 });
  },
});

/** Like toggle. Returns { liked, likeCount }. */
export const toggleLike = mutation({
  args: { publicId: v.string(), userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = await userKey(ctx, args.userKey);
    const board = await boardOrThrow(ctx, args.publicId);
    const existing = await ctx.db
      .query("boardLikes")
      .withIndex("by_user_board", (q) => q.eq("userKey", key).eq("boardId", board._id))
      .unique();
    let likeCount = board.likeCount ?? 0;
    if (existing) {
      await ctx.db.delete(existing._id);
      likeCount = Math.max(0, likeCount - 1);
      await ctx.db.patch(board._id, { likeCount });
      return { liked: false, likeCount };
    }
    await ctx.db.insert("boardLikes", { boardId: board._id, userKey: key, createdAt: now() });
    likeCount += 1;
    await ctx.db.patch(board._id, { likeCount });
    return { liked: true, likeCount };
  },
});

/** Save (bookmark) toggle. Returns { saved, saveCount }. */
export const toggleSave = mutation({
  args: { publicId: v.string(), userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = await userKey(ctx, args.userKey);
    const board = await boardOrThrow(ctx, args.publicId);
    const existing = await ctx.db
      .query("boardSaves")
      .withIndex("by_user_board", (q) => q.eq("userKey", key).eq("boardId", board._id))
      .unique();
    let saveCount = board.saveCount ?? 0;
    if (existing) {
      await ctx.db.delete(existing._id);
      saveCount = Math.max(0, saveCount - 1);
      await ctx.db.patch(board._id, { saveCount });
      return { saved: false, saveCount };
    }
    await ctx.db.insert("boardSaves", { boardId: board._id, userKey: key, createdAt: now() });
    saveCount += 1;
    await ctx.db.patch(board._id, { saveCount });
    return { saved: true, saveCount };
  },
});

/** Boards a user saved, newest first. */
export const savedBoards = query({
  args: { userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = await userKey(ctx, args.userKey);
    const rows = await ctx.db
      .query("boardSaves")
      .withIndex("by_user_board", (q) => q.eq("userKey", key))
      .collect();
    const boards = await Promise.all(rows.map((r) => ctx.db.get(r.boardId)));
    return boards.filter((b) => b !== null);
  },
});

/** Add a comment (max 500 chars). Returns the row id. */
export const addComment = mutation({
  args: {
    publicId: v.string(),
    userKey: v.optional(v.string()),
    username: v.optional(v.string()),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const key = await userKey(ctx, args.userKey);
    const text = args.text.trim().slice(0, 500);
    if (!text) throw new Error("Comment is empty.");
    const board = await boardOrThrow(ctx, args.publicId);
    const id = await ctx.db.insert("boardComments", {
      boardId: board._id,
      userKey: key,
      username: args.username,
      text,
      createdAt: now(),
    });
    await ctx.db.patch(board._id, { commentCount: (board.commentCount ?? 0) + 1 });
    return id;
  },
});

export const listComments = query({
  args: { publicId: v.string() },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
      .unique();
    if (!board) return [];
    return await ctx.db
      .query("boardComments")
      .withIndex("by_board", (q) => q.eq("boardId", board._id))
      .collect();
  },
});

/** Remove own comment (or any, when board owner). */
export const removeComment = mutation({
  args: { commentId: v.id("boardComments"), userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = await userKey(ctx, args.userKey);
    const row = await ctx.db.get(args.commentId);
    if (!row) return;
    const board = await ctx.db.get(row.boardId);
    const owner = board?.ownerId !== undefined && board.ownerId === key;
    if (row.userKey !== key && !owner) throw new Error("Not your comment.");
    await ctx.db.delete(row._id);
    if (board) {
      await ctx.db.patch(board._id, { commentCount: Math.max(0, (board.commentCount ?? 1) - 1) });
    }
  },
});
