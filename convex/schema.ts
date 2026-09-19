// DRAFT — not compiled (convex/ excluded from tsconfig). Your job: install
// convex, run `npx convex dev`, paste/adjust.
//
// Tables: boards + links. Board JSON travels as a string snapshot so the
// versioned document stays the single source of truth on both sides.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  boards: defineTable({
    publicId: v.string(),
    title: v.string(),
    snapshot: v.string(), // JSON.stringify(Board)
    version: v.number(),
    showcase: v.optional(v.boolean()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_publicId", ["publicId"]),

  links: defineTable({
    slug: v.string(),
    boardId: v.id("boards"),
    createdAt: v.string(),
  }).index("by_slug", ["slug"]),
});
