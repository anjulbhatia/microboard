import { describe, expect, test } from "bun:test";
import { timeAgo } from "../app/shared/lib/time";

describe("timeAgo", () => {
  test("buckets", () => {
    const now = Date.now();
    expect(timeAgo(new Date(now - 10_000).toISOString())).toBe("just now");
    expect(timeAgo(new Date(now - 5 * 60_000).toISOString())).toBe("5m ago");
    expect(timeAgo(new Date(now - 3 * 3600_000).toISOString())).toBe("3h ago");
    expect(timeAgo(new Date(now - 2 * 86400_000).toISOString())).toBe("2d ago");
    expect(timeAgo("nope")).toBe("just now");
  });
});
