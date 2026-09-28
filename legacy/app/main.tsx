import { StrictMode, Suspense, lazy, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Providers } from '@/providers'
import { getConvexUrl } from '@/lib/backend'
import './index.css'
import App from '@/App'

const ConvexShell = lazy(() =>
  import('@/lib/convex-shell').then((m) => ({ default: m.ConvexShell }))
);

/**
 * Backend shell. Without VITE_CONVEX_URL the app runs fully offline;
 * with it, the Convex client (and codegen) loads lazily.
 */
function BackendShell({ children }: { children: ReactNode }) {
  if (!getConvexUrl()) return <>{children}</>;
  return (
    <Suspense fallback={children}>
      <ConvexShell>{children}</ConvexShell>
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <BackendShell>
        <Providers>
          <App />
        </Providers>
      </BackendShell>
    </BrowserRouter>
  </StrictMode>,
)
