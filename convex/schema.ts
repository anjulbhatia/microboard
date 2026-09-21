import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // One row per account. Demo login provisions a row with a name;
  // email OTP (AgentMail) and Google SSO attach to the same row later.
  users: defineTable({
    name: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  }).index("by_name", ["name"]),

  // Board snapshots. Separate table with ownerId (not embedded in users)
  // so sharing/showcase query without loading private docs.
  // ownerId is the users row id as a string; optional until auth lands
  // so local/demo boards keep working.
  boards: defineTable({
    publicId: v.string(),
    ownerId: v.optional(v.string()),
    title: v.string(),
    snapshot: v.string(),
    version: v.number(),
    showcase: v.optional(v.boolean()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_publicId", ["publicId"])
    .index("by_owner", ["ownerId"]),

  links: defineTable({
    slug: v.string(),
    boardId: v.id("boards"),
    createdAt: v.string(),
  }).index("by_slug", ["slug"]),
});
