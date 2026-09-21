import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // One row per Convex Auth account. The username component keeps the
  // username, so this table needs no fields.
  users: defineTable({}),

  // Board snapshots for share links. The versioned JSON document stays the
  // single source of truth on both sides.
  boards: defineTable({
    publicId: v.string(),
    title: v.string(),
    snapshot: v.string(),
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
