import { create, type StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { normalizeUsername } from "@/lib/routes";

export interface SessionUser {
  /** Stable id used as boards ownerId. Demo: localStorage-backed. */
  id: string;
  /** Public handle. Identifier for u/[username]. */
  username: string;
  name: string;
  hue: number;
  demo: boolean;
}

interface SessionAck {
  /** Last server time returned by the Convex heartbeat. */
  serverTime: number;
  /** Client time the ack landed. */
  at: number;
}

interface SessionStore {
  user: SessionUser | null;
  /** Last backend acknowledgement. Null until first heartbeat lands. */
  ack: SessionAck | null;
  signIn: (username?: string) => void;
  /** Link a Convex Auth identity (demo:false, remote namespace). */
  linkRemote: (username: string) => void;
  rename: (username: string) => void;
  signOut: () => void;
  setAck: (serverTime: number) => void;
}

const DEMO_KEY = "microboard.demoId";
const BROWSER_SESSION_KEY = "microboard.sessionId";

/** Stable per-browser session id, acknowledged by Convex heartbeat. */
export function browserSessionId(): string {
  try {
    const saved = localStorage.getItem(BROWSER_SESSION_KEY);
    if (saved && /^[A-Za-z0-9_-]{1,128}$/.test(saved)) return saved;
    const id = `sess-${crypto.randomUUID()}`;
    localStorage.setItem(BROWSER_SESSION_KEY, id);
    return id;
  } catch {
    return `sess-${crypto.randomUUID()}`;
  }
}

function demoId(): string {
  try {
    const saved = localStorage.getItem(DEMO_KEY);
    if (saved) return saved;
    const id = `demo-${crypto.randomUUID()}`;
    localStorage.setItem(DEMO_KEY, id);
    return id;
  } catch {
    return `demo-${crypto.randomUUID()}`;
  }
}

const hasBrowserStorage =
  typeof localStorage !== "undefined" && typeof window !== "undefined";

const sessionCreator: StateCreator<SessionStore> = (set) => ({
  user: null,
  ack: null,
  signIn: (username) =>
    set({
      user: {
        id: demoId(),
        username: normalizeUsername(username ?? "Guest Creator"),
        name: "Guest Creator",
        hue: Math.floor(Math.random() * 360),
        demo: true,
      },
    }),
  signOut: () => set({ user: null, ack: null }),
  setAck: (serverTime) => set({ ack: { serverTime, at: Date.now() } }),
  linkRemote: (username) =>
    set({
      user: {
        id: `remote-${normalizeUsername(username)}`,
        username: normalizeUsername(username),
        name: normalizeUsername(username),
        hue: Math.floor(Math.random() * 360),
        demo: false,
      },
    }),
  rename: (username) =>
    set((s) => {
      if (!s.user) return s;
      const slug = normalizeUsername(username);
      if (slug === s.user.username) return s;
      return { user: { ...s.user, username: slug } };
    }),
});

const persistedSession = persist(sessionCreator, {
  name: "microboard.session.v1",
  storage: createJSONStorage(() => localStorage),
  partialize: (s) => ({ user: s.user }) as SessionStore,
}) as StateCreator<SessionStore>;

/** Stub auth until email OTP (AgentMail) lands. Demo provisions a stable id. */
export const useSession = create<SessionStore>()(
  hasBrowserStorage ? persistedSession : sessionCreator
);
