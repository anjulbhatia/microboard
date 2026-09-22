import { useState } from 'react';
import { useConvex } from 'convex/react';
import { useBoard } from '@/store/board';
import { useSession } from '@/store/session';
import { isBackendConfigured } from '@/lib/backend';
import { boardSnapshot, publicBoardUrl, type ShareResult, type ShareStatus } from '@/features/share/types';

/**
 * Publish seam. Local link when offline; boards.save on Convex when
 * configured (codegen import stays dynamic so offline clones build).
 */
export function useShare() {
  const board = useBoard((s) => s.board);
  const user = useSession((s) => s.user);
  const convex = useConvexSafe();
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [result, setResult] = useState<ShareResult | null>(null);
  const [error, setError] = useState('');

  const publish = async (): Promise<ShareResult> => {
    setStatus('publishing');
    setError('');
    try {
      if (convex) {
        const { api } = await import('../../../convex/_generated/api');
        await convex.mutation(api.boards.save, {
          publicId: board.id,
          ownerId: user?.id,
          title: board.title,
          snapshot: boardSnapshot(board),
          version: board.version,
        });
        const res: ShareResult = { publicId: board.id, url: publicBoardUrl(board.id), backend: 'convex' };
        setResult(res);
        setStatus('done');
        return res;
      }
      const res: ShareResult = {
        publicId: board.id,
        url: publicBoardUrl(board.id),
        backend: 'local',
      };
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

/** useConvex only under the provider; null offline. */
function useConvexSafe() {
  if (!isBackendConfigured()) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useConvex();
}
