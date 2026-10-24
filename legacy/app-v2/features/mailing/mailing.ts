export interface Subscriber {
  email: string;
  createdAt: string;
}

export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Add unless blank, invalid, or duplicate (case-insensitive). */
export function addSubscriber(
  list: Subscriber[],
  raw: string
): { list: Subscriber[]; error: string } {
  const email = normalizeEmail(raw);
  if (!email) return { list, error: "Type an email first." };
  if (!isEmailValid(email)) return { list, error: "That email does not look right." };
  if (list.some((s) => s.email === email)) return { list, error: "Already on the list." };
  return {
    list: [...list, { email, createdAt: new Date().toISOString() }],
    error: "",
  };
}

export function removeSubscriber(list: Subscriber[], email: string): Subscriber[] {
  return list.filter((s) => s.email !== email);
}

export const MAILING_KEY = "microboard.mailing.v1";

export function loadMailing(get: (k: string) => string | null): Subscriber[] {
  try {
    const raw = get(MAILING_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Subscriber[];
    return Array.isArray(list) ? list.filter((s) => isEmailValid(s.email)) : [];
  } catch {
    return [];
  }
}
