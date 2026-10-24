import { describe, expect, test } from "bun:test";
import {
  HOME_SECTIONS,
  isUsernameValid,
  normalizeUsername,
  profilePath,
  sharePath,
} from "../app/lib/routes";

describe("routes", () => {
  test("share + profile paths are canonical", () => {
    expect(sharePath("abc")).toBe("/share/abc");
    expect(profilePath("Anjul_B")).toBe("/u/anjul_b");
  });

  test("username validation", () => {
    expect(isUsernameValid("anjul-b_1")).toBe(true);
    expect(isUsernameValid("ab")).toBe(false);
    expect(isUsernameValid("UPPER")).toBe(false);
    expect(isUsernameValid("-lead")).toBe(false);
  });

  test("normalizeUsername slugifies with guest fallback", () => {
    expect(normalizeUsername("Anjul Bhatia!")).toBe("anjul-bhatia");
    expect(normalizeUsername("")).toBe("guest-creator");
    expect(normalizeUsername("a")).toBe("guest-a");
  });

  test("home sidebar covers the six sections", () => {
    expect(HOME_SECTIONS.map((s) => s.id)).toEqual([
      "home",
      "data",
      "mailing",
      "history",
      "analytics",
      "profile",
    ]);
  });
});
