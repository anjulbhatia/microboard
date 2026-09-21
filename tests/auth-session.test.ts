import { beforeEach, describe, expect, test } from "bun:test";
import { useSession } from "../app/store/session";

beforeEach(() => {
  useSession.getState().signOut();
});

describe("session auth", () => {
  test("signIn provisions username and demo id", () => {
    useSession.getState().signIn("Anjul Bhatia!");
    const a = useSession.getState().user;
    expect(a?.username).toBe("anjul-bhatia");
    expect(a?.demo).toBe(true);
    expect(a?.id.startsWith("demo-")).toBe(true);
  });

  test("rename slugifies, no-ops on same name", () => {
    useSession.getState().signIn("creator");
    useSession.getState().rename("New Name 99");
    expect(useSession.getState().user?.username).toBe("new-name-99");
    const before = useSession.getState().user;
    useSession.getState().rename("new-name-99");
    expect(useSession.getState().user).toBe(before);
  });

  test("rename without a session is a no-op", () => {
    useSession.getState().rename("ghost");
    expect(useSession.getState().user).toBeNull();
  });
});
