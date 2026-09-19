import { create } from "zustand";

export interface SessionUser {
  name: string;
  hue: number;
}

interface SessionStore {
  user: SessionUser | null;
  signIn: () => void;
  signOut: () => void;
}

/** Stub auth until real sign-in lands. Sign-in provisions attach to Share. */
export const useSession = create<SessionStore>()((set) => ({
  user: null,
  signIn: () =>
    set({
      user: {
        name: "Guest Creator",
        hue: Math.floor(Math.random() * 360),
      },
    }),
  signOut: () => set({ user: null }),
}));
