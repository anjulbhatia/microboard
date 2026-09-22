import { describe, expect, test } from "bun:test";
import {
  TEMPLATES,
  customTemplate,
  escapeHtml,
  magicLinkTemplate,
  render,
  shareBoardTemplate,
} from "../app/features/agentmail/templates";
import { CUSTOM_HTML, MAGIC_LINK_HTML, SHARE_BOARD_HTML } from "../app/features/agentmail/compiled";

describe("agentmail templates", () => {
  test("compiled matches the html sources (run bun run agentmail:build)", async () => {
    const files = {
      "magic-link.html": MAGIC_LINK_HTML,
      "share-board.html": SHARE_BOARD_HTML,
      "custom.html": CUSTOM_HTML,
    } as const;
    for (const [f, compiled] of Object.entries(files)) {
      const source = await Bun.file(new URL(`../app/features/agentmail/${f}`, import.meta.url)).text();
      expect(compiled).toBe(source);
    }
  });

  test("render fills tokens", () => {
    expect(render("{{TITLE}}-{{PREHEADER}}-{{BODY}}", { title: "T", preheader: "P", body: "B" })).toBe("T-P-B");
  });
  test("registry exposes the three templates", () => {
    expect(Object.keys(TEMPLATES).sort()).toEqual(["custom", "magicLink", "shareBoard"]);
  });

  test("magic link carries expiry + CTA", () => {
    const m = magicLinkTemplate({ url: "https://x.test/in?token=abc", username: "ada" });
    expect(m.subject).toBe("Sign in to Microboard");
    expect(m.text).toContain("15 minutes");
    expect(m.text).toContain("https://x.test/in?token=abc");
    expect(m.html).toContain("Sign in</a>");
    expect(m.html).toContain("ada");
  });

  test("share board carries title, url and stats", () => {
    const m = shareBoardTemplate({
      url: "https://x.test/share/1",
      boardTitle: "Q1",
      from: "ada",
      stats: "4 widgets",
    });
    expect(m.subject).toBe("Microboard: Q1");
    expect(m.text).toContain("https://x.test/share/1");
    expect(m.html).toContain("Open board</a>");
    expect(m.html).toContain("4 widgets");
  });

  test("custom composes lines with optional CTA", () => {
    const m = customTemplate({
      subject: "Hi",
      title: "Drop",
      lines: ["One", "Two"],
      ctaLabel: "Go",
      ctaUrl: "https://x.test",
    });
    expect(m.text).toContain("One\nTwo");
    expect(m.html).toContain("Go</a>");
    const bare = customTemplate({ subject: "H", title: "T", lines: ["x"] });
    expect(bare.html).not.toContain("<a href=");
  });

  test("user content is escaped", () => {
    expect(escapeHtml('<b>"&"</b>')).toBe("&lt;b&gt;&quot;&amp;&quot;&lt;/b&gt;");
    const m = shareBoardTemplate({ url: "https://x", boardTitle: "<Q1>" });
    expect(m.html).toContain("&lt;Q1&gt;");
    expect(m.html).not.toContain("<Q1>");
  });
});
