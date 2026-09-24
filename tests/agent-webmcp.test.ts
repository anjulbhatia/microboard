import { describe, expect, test } from "bun:test";
import { handleChatMessage, type AgentBoardApi } from "../app/features/agent/chat-agent";
import { runWebmcpTool, webmcpManifest } from "../app/features/agent/webmcp";

function fakeApi(over: Partial<AgentBoardApi> = {}): AgentBoardApi & { calls: string[] } {
  const calls: string[] = [];
  const api: AgentBoardApi & { calls: string[] } = {
    calls,
    columns: () => ["month", "visitors", "signups"],
    hasData: () => true,
    loadSample: () => void calls.push("loadSample"),
    addStep: (t, p, d) => void calls.push(`step:${t}:${d}`),
    addChart: (k, x, y) => void calls.push(`chart:${k}:${x}:${y}`),
    summary: () => "3 rows · 3 cols.",
    state: () => ({ title: "Test", version: 2, steps: 1, widgets: 2, columns: ["month", "visitors", "signups"] }),
  };
  return Object.assign(api, over);
}

describe("chat agent", () => {
  test("help lists capabilities", () => {
    expect(handleChatMessage("help", fakeApi()).text).toMatch(/chart/);
  });

  test("empty and unknown guide the user", () => {
    expect(handleChatMessage("  ", fakeApi()).text).toMatch(/Ask for data/);
    expect(handleChatMessage("hello there", fakeApi()).text).toMatch(/help/);
  });

  test("load sample fires once", () => {
    const api = fakeApi({ hasData: () => false });
    const r = handleChatMessage("load sample", api);
    expect(api.calls).toEqual(["loadSample"]);
    expect(r.text).toMatch(/Loaded/);
  });

  test("clean nulls adds dropNulls", () => {
    const api = fakeApi();
    handleChatMessage("clean nulls please", api);
    expect(api.calls).toEqual(["step:dropNulls:drop rows with empty cells"]);
  });

  test("sort parses column and direction", () => {
    const api = fakeApi();
    const r = handleChatMessage("sort by visitors desc", api);
    expect(api.calls).toEqual(["step:sort:sort visitors desc"]);
    expect(r.text).toMatch(/visitors \(desc\)/);
  });

  test("sort rejects unknown columns", () => {
    const r = handleChatMessage("sort by nope", fakeApi());
    expect(r.text).toMatch(/No column/);
  });

  test("filter builds params", () => {
    const api = fakeApi();
    handleChatMessage("filter visitors > 100", api);
    expect(api.calls[0]).toMatch(/^step:filter:/);
  });

  test("chart by picks kind and columns", () => {
    const api = fakeApi();
    const r = handleChatMessage("chart signups by month", api);
    expect(api.calls).toEqual(["chart:dither-bar:month:signups"]);
    expect(r.text).toMatch(/dither-bar/);
    const api2 = fakeApi();
    handleChatMessage("kpi chart signups by month", api2);
    expect(api2.calls).toEqual(["chart:kpi:month:signups"]);
  });

  test("summarize reports board state", () => {
    expect(handleChatMessage("summarize", fakeApi()).text).toBe("3 rows · 3 cols.");
  });

  test("inline ops pass through with INLINE marker", () => {
    expect(handleChatMessage("transform_data --op dropNulls", fakeApi()).text).toMatch(/^INLINE /);
  });

  test("data-gated replies ask to load first", () => {
    const api = fakeApi({ hasData: () => false });
    expect(handleChatMessage("clean nulls", api).text).toMatch(/Load data/);
    expect(api.calls).toEqual([]);
  });
});

describe("webmcp", () => {
  test("manifest covers data ops plus board tools", () => {
    const m = webmcpManifest();
    expect(m.version).toBe(1);
    expect(m.scopes).toEqual(["data", "board"]);
    const names = m.tools.map((t) => t.name);
    for (const n of ["get_data", "transform_data", "inspect_data", "board.get_state", "board.chat", "board.load_sample", "board.add_step", "board.add_chart"]) {
      expect(names).toContain(n);
    }
  });

  test("get_state returns structured snapshot", async () => {
    const r = await runWebmcpTool("board.get_state", {}, fakeApi());
    expect(r.ok).toBe(true);
    expect(JSON.parse(r.reply)).toEqual({
      title: "Test", version: 2, steps: 1, widgets: 2, columns: ["month", "visitors", "signups"],
    });
  });

  test("add_step rejects unknown types and bad params", async () => {
    const api = fakeApi();
    const bad = await runWebmcpTool("board.add_step", { type: "explode" }, api);
    expect(bad.ok).toBe(false);
    expect(api.calls).toEqual([]);
    const badParams = await runWebmcpTool("board.add_step", { type: "sort", params: "nope" }, api);
    expect(badParams.ok).toBe(false);
    const good = await runWebmcpTool(
      "board.add_step",
      { type: "sort", params: { column: "visitors", dir: "desc" } },
      api
    );
    expect(good.ok).toBe(true);
    expect(api.calls).toEqual(["step:sort:sort step"]);
  });

  test("add_chart rejects unknown kinds and empty columns", async () => {
    const api = fakeApi();
    expect((await runWebmcpTool("board.add_chart", { kind: "hologram", x: "a", y: "b" }, api)).ok).toBe(false);
    expect((await runWebmcpTool("board.add_chart", { kind: "kpi", x: "", y: "" }, api)).ok).toBe(false);
    expect(api.calls).toEqual([]);
    const good = await runWebmcpTool("board.add_chart", { kind: "kpi", x: "month", y: "signups" }, api);
    expect(good.ok).toBe(true);
    expect(api.calls).toEqual(["chart:kpi:month:signups"]);
  });

  test("data ops take args directly (spaces survive)", async () => {
    const d0 = await runWebmcpTool("get_data", { type: "sample" }, fakeApi());
    expect(d0.ok).toBe(true);
    const { runOp } = await import("../app/features/data/ops");
    const data = await runOp("get_data", { type: "sample" });
    // Quoted multi-word value would shatter the old inline round-trip.
    const f = await runWebmcpTool(
      "transform_data",
      { data, op: "filter", column: "channel", cond: "contains", value: "a b" },
      fakeApi()
    );
    expect(f.ok).toBe(true);
  });

  test("board tools run through the agent", async () => {
    const api = fakeApi();
    const r1 = await runWebmcpTool("board.chat", { text: "clean nulls" }, api);
    expect(r1.ok).toBe(true);
    expect(api.calls.length).toBe(1);
    const r2 = await runWebmcpTool("board.load_sample", {}, fakeApi());
    expect(r2).toEqual({ ok: true, reply: "Sample loaded." });
  });

  test("data ops run inline", async () => {
    const r = await runWebmcpTool("get_data", { type: "sample" }, fakeApi());
    expect(r.ok).toBe(true);
    expect(r.reply).toMatch(/12 rows/);
  });

  test("failures report ok:false", async () => {
    const r = await runWebmcpTool("nope", {}, fakeApi());
    expect(r.ok).toBe(false);
  });
});
