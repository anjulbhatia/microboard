import { describe, expect, test } from "bun:test";
import { addSubscriber, isEmailValid, loadMailing, removeSubscriber } from "../app/features/mailing/mailing";

describe("mailing list", () => {
  test("email validation", () => {
    expect(isEmailValid("ada@example.com")).toBe(true);
    expect(isEmailValid("nope")).toBe(false);
    expect(isEmailValid("a@b.c")).toBe(false);
  });

  test("add dedupes case-insensitively, rejects junk", () => {
    let list = addSubscriber([], "Ada@Example.com").list;
    expect(list).toEqual([{ email: "ada@example.com", createdAt: expect.any(String) }]);
    expect(addSubscriber(list, "ADA@example.com").error).toMatch(/Already/);
    expect(addSubscriber(list, "bad").error).toMatch(/look right/);
    expect(addSubscriber(list, "  ").error).toMatch(/first/);
    list = removeSubscriber(list, "ada@example.com");
    expect(list).toEqual([]);
  });

  test("load filters invalid and corrupt docs", () => {
    const good = loadMailing(() => JSON.stringify([{ email: "a@b.co", createdAt: "x" }, { email: "bad" }]));
    expect(good.map((s) => s.email)).toEqual(["a@b.co"]);
    expect(loadMailing(() => "{nope")).toEqual([]);
    expect(loadMailing(() => null)).toEqual([]);
  });
});
