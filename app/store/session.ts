import { create } from "zustand";

export interface SessionUser {
  /** Stable id used as boards ownerId. Demo: localStorage-backed. */
  id: string;
  name: string;
  hue: number;
  demo: boolean;
}

interface SessionStore {
  user: SessionUser | null;
  signIn: () => void;
  signOut: () => void;
}

const DEMO_KEY = "microboard.demoId";

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

/** Stub auth until email OTP (AgentMail) lands. Demo provisions a stable id. */
export const useSession = create<SessionStore>()((set) => ({
  user: null,
  signIn: () =>
    set({
      user: {
        id: demoId(),
        name: "Guest Creator",
        hue: Math.floor(Math.random() * 360),
        demo: true,
      },
    }),
  signOut: () => set({ user: null }),
}));
