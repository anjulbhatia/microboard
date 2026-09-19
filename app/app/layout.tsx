import { SiteHeader, SiteFooter } from '@/features/navigation';
import type { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <SiteHeader />

      <main className="min-h-0 flex-1 overflow-hidden">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
