import { Link } from 'react-router-dom';
import { useBoard } from '@/app/store/board';

/**
 * Dashboard — collections home for the agentic Canva vision.
 * v1: reads local board store only. Convex collections land here next.
 */
export function DashboardPage() {
  const board = useBoard((s) => s.board);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your micro cards, collections, and recent boards live here.
        </p>
      </div>

      <div className="rounded-lg border p-5">
        <p className="font-mono text-xs text-muted-foreground">CURRENT BOARD · v{board.version}</p>
        <p className="mt-1 text-lg font-semibold">{board.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {Object.keys(board.pages[0]?.widgets ?? {}).length} widgets · {board.steps.length} steps
        </p>
        <div className="mt-4 flex gap-2">
          <Link to="/create" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Open in editor
          </Link>
          <Link to="/showcase" className="rounded-md border px-4 py-2 text-sm">
            Showcase
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
        Collections (greetings, visualizations, shared boards) ship here for the All Gas Hackathon —
        backed by Convex + AgentMail. Placeholder by design; no mock backend.
      </div>
    </div>
  );
}
