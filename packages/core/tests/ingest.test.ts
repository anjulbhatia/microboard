import { describe, expect, test } from "bun:test";
import { assertPublicUrl, ingestData, normalizeRows, parseCsv, parseJson } from "../src/index";

describe("ingest", () => {
  test("quoted CSV parses", () => {
    const rows = parseCsv('name,note\nAda,"hi, there"\nLin,"say ""yo"""');
    expect(rows).toEqual([
      { name: "Ada", note: "hi, there" },
      { name: "Lin", note: 'say "yo"' },
    ]);
  });

  test("JSON arrays and {rows} envelopes parse", () => {
    expect(parseJson('[{"a":1}]')).toEqual([{ a: 1 }]);
    expect(parseJson('{"rows":[{"a":2}]}')).toEqual([{ a: 2 }]);
  });

  test("sample ingest returns rows", async () => {
    const data = await ingestData({ type: "sample" });
    expect(data.rows).toHaveLength(12);
    expect(data.rows[0]?.month).toBe("Jan");
  });

  test("normalizeRows rejects empty and oversized datasets", () => {
    expect(() => normalizeRows([])).toThrow("no rows");
    expect(() => normalizeRows([{ a: "x".repeat(10_001) }])).toThrow("exceeds");
  });

  test("private URLs are refused", () => {
    expect(() => assertPublicUrl("http://localhost:3000/data.csv")).toThrow("Private");
    expect(() => assertPublicUrl("http://127.0.0.1/x")).toThrow("Private");
    expect(() => assertPublicUrl("file:///etc/passwd")).toThrow("http(s)");
    expect(assertPublicUrl("https://example.com/data.csv").hostname).toBe("example.com");
  });
});
