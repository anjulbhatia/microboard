import { action, internalMutation, query } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { v } from "convex/values";
import { AgentMail } from "@agentmail/convex";
import { shareBoardTemplate } from "../app/features/agentmail/templates";
import { now, userKey } from "./helpers";

/**
 * Board drops via AgentMail. One inbox per owner (cached in mailInboxes);
 * sending needs AGENTMAIL_API_KEY on the deployment.
 */

export const getInbox = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mailInboxes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .unique();
  },
});

export const saveInbox = internalMutation({
  args: { ownerId: v.string(), inboxId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mailInboxes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("mailInboxes", {
      ownerId: args.ownerId,
      inboxId: args.inboxId,
      createdAt: now(),
    });
  },
});

/**
 * Email a public board link to every subscriber. Returns { sent }.
 * Throws when no subscribers or the API key is missing.
 */
export const sendBoardLink = action({
  args: {
    ownerId: v.optional(v.string()),
    boardPublicId: v.string(),
    boardTitle: v.string(),
  },
  handler: async (ctx, args): Promise<{ sent: number }> => {
    const key = await userKey(ctx, args.ownerId);
    const subs = await ctx.runQuery(api.subscribers.listByOwner, { ownerId: key });
    if (subs.length === 0) throw new Error("Mailing list is empty.");
    if (!process.env.AGENTMAIL_API_KEY) {
      throw new Error("AgentMail not configured — set AGENTMAIL_API_KEY.");
    }
    const cached = await ctx.runQuery(api.mailing.getInbox, { ownerId: key });
    let inboxId = cached?.inboxId;
    if (!inboxId) {
      const mail = new AgentMail(components.agentmail);
      const created = (await mail.createInbox(ctx, {
        displayName: `Microboard ${key.slice(0, 12)}`,
      })) as unknown as { id?: string; inboxId?: string };
      inboxId = created.id ?? created.inboxId;
      if (!inboxId) throw new Error("Could not create sending inbox.");
      await ctx.runMutation(internal.mailing.saveInbox, { ownerId: key, inboxId });
    }
    await ctx.runMutation(internal.mailing.dispatchBatch, {
      inboxId,
      boardPublicId: args.boardPublicId,
      boardTitle: args.boardTitle,
      emails: subs.map((s) => s.email),
    });
    return { sent: subs.length };
  },
});

/** Mutation half of the send: owns the AgentMail message calls. */
export const dispatchBatch = internalMutation({
  args: {
    inboxId: v.string(),
    boardPublicId: v.string(),
    boardTitle: v.string(),
    emails: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const mail = new AgentMail(components.agentmail);
    const url = `${process.env.SITE_URL ?? ""}/share/${args.boardPublicId}`;
    const tpl = shareBoardTemplate({ url, boardTitle: args.boardTitle });
    for (const to of args.emails) {
      await mail.sendMessage(ctx, args.inboxId, {
        to,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
      });
    }
  },
});
