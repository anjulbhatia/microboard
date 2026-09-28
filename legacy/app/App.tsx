import { Routes, Route, useParams, Navigate, Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { LandingPage } from '@/features/landing';
import { CreatePage } from '@/features/board';
import { RequireAuth } from '@/features/auth';
import { HomePage } from '@/features/home';
import { PublicProfilePage } from '@/features/profile';
import { isBackendConfigured } from '@/lib/backend';

// Codegen-backed pages — lazy so offline clones still build.
const ShowcasePage = lazy(() =>
  import('@/features/showcase/showcase-page').then((m) => ({ default: m.ShowcasePage }))
);
const ShareDetailPage = lazy(() =>
  import('@/features/showcase/share-detail-page').then((m) => ({ default: m.ShareDetailPage }))
);

function LiveFallback() {
  return <p className="p-8 font-mono text-xs text-muted-foreground">Loading…</p>;
}

/**
 * Shell map. Landing is a single self-contained page; showcase/profile
 * reuse this minimal chrome until their own revamp lands.
 */
function LandingChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
          <Link to="/" aria-label="Microboard home" className="font-display text-sm tracking-[0.2em]">
            MICROBOARD
          </Link>
          <span className="flex-1" />
          <Link
            to="/new"
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start creating
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <p className="border-t py-4 text-center font-mono text-[11px] text-muted-foreground">
        clean data · craft microcharts · ship dashboards
      </p>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" aria-label="Microboard home" className="font-display text-sm tracking-[0.2em] text-muted-foreground hover:text-foreground">
      MICROBOARD
    </Link>
  );
}

function Showcase() {
  if (!isBackendConfigured()) {
    return (
      <LandingChrome>
        <div className="flex flex-col items-center justify-center px-8 pt-28 pb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Showcase</h1>
          <p className="text-muted-foreground mt-2">Public gallery of shared boards goes here.</p>
        </div>
      </LandingChrome>
    );
  }
  return (
    <LandingChrome>
      <Suspense fallback={<LiveFallback />}>
        <ShowcasePage />
      </Suspense>
    </LandingChrome>
  );
}

function SharedBoard() {
  const { id } = useParams<{ id: string }>();
  if (!isBackendConfigured()) {
    return (
      <div className="flex h-svh flex-col bg-background">
        <div className="flex shrink-0 items-center justify-between px-4 py-3">
          <Brand />
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Shared board</h1>
          <p className="text-muted-foreground mt-2 font-mono">{id}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-4">
        <Brand />
      </div>
      <Suspense fallback={<LiveFallback />}>
        <ShareDetailPage />
      </Suspense>
    </div>
  );
}

function LegacySharedBoard() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/share/${id}`} replace />;
}

function Profile() {
  return (
    <LandingChrome>
      <div className="px-4 pt-24 pb-8">
        <PublicProfilePage />
      </div>
    </LandingChrome>
  );
}

function NotFound() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-2 p-8 text-center">
      <Brand />
      <h1 className="mt-4 text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-2">Page not found.</p>
    </div>
  );
}

function NewBoard() {
  // Open canvas: no gate, no upfront user. Login lives in the header.
  return <div className="h-svh"><CreatePage /></div>;
}

function Home() {
  return (
    <RequireAuth next="/home">
      <div className="h-svh bg-background"><HomePage /></div>
    </RequireAuth>
  );
}

function App() {

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/new" element={<NewBoard />} />
      <Route path="/create" element={<Navigate to="/new" replace />} />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/showcase" element={<Showcase />} />
      <Route path="/share/:id" element={<SharedBoard />} />
      <Route path="/b/:id" element={<LegacySharedBoard />} />
      <Route path="/u/:username" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
