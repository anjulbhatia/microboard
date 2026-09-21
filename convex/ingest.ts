import { action, internalMutation, query } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { v } from "convex/values";

const firecrawl = new FirecrawlClient(components.firecrawl);

export const saveIngest = internalMutation({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
    excerpt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ingests", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

// Scrape a public URL into board data. Firecrawl returns LLM-ready markdown;
// the excerpt stored here is what the board / agent propose loop reads.
export const scrapeUrl = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const doc = await firecrawl.scrape(ctx, args.url, {
      formats: ["markdown"],
      onlyMainContent: true,
    });
    const excerpt = (doc.markdown ?? "").slice(0, 4000);
    const title = doc.metadata?.title;
    const ingestId = await ctx.runMutation(internal.ingest.saveIngest, {
      url: args.url,
      title,
      excerpt,
    });
    return { ingestId, url: args.url, title, excerpt };
  },
});

export const recent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ingests").order("desc").take(10);
  },
});
