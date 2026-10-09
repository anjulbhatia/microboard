import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { now, userKey } from "./helpers";

/**
 * Short share slugs: memorable aliases (`/b/<slug>` style) for board
 * public ids. Slugs are global and owner-managed; resolution is public.
 */

function cleanSlug(raw: string): string {
  const slug = raw.trim().toLowerCase().slice(0, 48);
  if (!/^[a-z0-9][a-z0-9-]{2,47}$/.test(slug)) {
    throw new Error("Slug needs 3-48 chars: lowercase, numbers, -.");
  }
  return slug;
}

async function boardOrThrow(ctx: MutationCtx, publicId: string) {
  const board = await ctx.db
    .query("boards")
    .withIndex("by_publicId", (q) => q.eq("publicId", publicId))
    .unique();
  if (!board) throw new Error("Board not found.");
  return board;
}

/** Claim a slug for a board. Owner-only when the board has an owner. */
export const create = mutation({
  args: {
    slug: v.string(),
    publicId: v.string(),
    ownerId: v.optional(v.string()),
  },
  returns: v.id("links"),
  handler: async (ctx, args) => {
    const slug = cleanSlug(args.slug);
    const board = await boardOrThrow(ctx, args.publicId);
    if (board.ownerId !== undefined) {
      const key = await userKey(ctx, args.ownerId);
      if (board.ownerId !== key) throw new Error("Not your board.");
    }
    const taken = await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (taken) throw new Error("Slug taken.");
    return await ctx.db.insert("links", {
      slug,
      boardId: board._id,
      createdAt: now(),
    });
  },
});

/** Public slug → board publicId. Null when unknown or board removed. */
export const resolve = query({
  args: { slug: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug.trim().toLowerCase().slice(0, 48)))
      .unique();
    if (!link) return null;
    const board = await ctx.db.get(link.boardId);
    return board?.publicId ?? null;
  },
});

/** Release a slug. Owner-only when the board has an owner. */
export const remove = mutation({
  args: { slug: v.string(), ownerId: v.optional(v.string()) },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug.trim().toLowerCase().slice(0, 48)))
      .unique();
    if (!link) return false;
    const board = await ctx.db.get(link.boardId);
    if (board?.ownerId !== undefined) {
      const key = await userKey(ctx, args.ownerId);
      if (board.ownerId !== key) throw new Error("Not your board.");
    }
    await ctx.db.delete(link._id);
    return true;
  },
});
