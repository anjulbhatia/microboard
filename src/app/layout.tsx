import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon } from '@hugeicons/core-free-icons';
import { DitherGradient } from '@/components/dither-kit/gradient';
import type { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold" aria-label="Microboard Home">
              <HugeiconsIcon icon={SparklesIcon} size={24} strokeWidth={1.5} className="text-primary" />
              <span>Microboard</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        {children}
      </main>

      <footer className="relative shrink-0 border-t py-5">
        <DitherGradient from="purple" direction="up" />
        <div className="relative container mx-auto px-4 text-center font-mono text-xs text-muted-foreground">
          <p>clean data · craft microcharts · ship dashboards</p>
        </div>
      </footer>
    </div>
  );
}
