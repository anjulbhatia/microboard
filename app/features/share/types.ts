import type { Board } from '@/features/board/types';

/** Where a shared board lives. `local` until Convex is wired. */
export type ShareBackend = 'local' | 'convex';

export interface ShareResult {
  publicId: string;
  url: string;
  backend: ShareBackend;
}

export type ShareStatus = 'idle' | 'publishing' | 'done' | 'error';

/**
 * Build the public URL for a board id. Route is `/b/:id` per AGENT.md
 * (legacy `/share/:id` still resolves — see App).
 */
export function publicBoardUrl(publicId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/b/${publicId}`;
}

/** Serialize the versioned board for the backend. Snapshot = source of truth. */
export function boardSnapshot(board: Board): string {
  return JSON.stringify(board);
}
