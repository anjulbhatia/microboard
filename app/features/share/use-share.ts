import { useState } from 'react';
import { useBoard } from '@/store/board';
import { isBackendConfigured } from '@/lib/backend';
import { boardSnapshot, publicBoardUrl, type ShareResult, type ShareStatus } from '@/features/share/types';

/**
 * Publish seam — local today, Convex when you wire it.
 *
 * Current behavior: resolves a `local` ShareResult (same link ShareMenu
 * already copies). When `VITE_CONVEX_URL` exists, dynamic-import
 * `convex/react` here and call the `boards.save` mutation with
 * `boardSnapshot(board)` — never statically import `convex/*`.
 */
export function useShare() {
  const board = useBoard((s) => s.board);
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [result, setResult] = useState<ShareResult | null>(null);
  const [error, setError] = useState('');

  const publish = async (): Promise<ShareResult> => {
    setStatus('publishing');
    setError('');
    try {
      if (isBackendConfigured()) {
        // Slot: const { useMutation } = await import('convex/react');
        // const save = useMutation(api.boards.save); ...
        throw new Error('Convex URL set but client not wired yet — your step.');
      }
      const res: ShareResult = {
        publicId: board.id,
        url: publicBoardUrl(board.id),
        backend: 'local',
      };
      // Touch snapshot so the contract stays exercised while local.
      boardSnapshot(board);
      setResult(res);
      setStatus('done');
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Publish failed.';
      setError(msg);
      setStatus('error');
      throw e;
    }
  };

  return { status, result, error, publish, backend: isBackendConfigured() ? 'convex' : 'local' as const };
}
