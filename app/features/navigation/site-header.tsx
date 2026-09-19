import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon } from '@hugeicons/core-free-icons';
import { ThemeToggle } from '@/shared/components/theme-toggle';

export function SiteHeader() {
  return (
    <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold" aria-label="Microboard Home">
            <HugeiconsIcon icon={SparklesIcon} size={24} strokeWidth={1.5} className="text-primary" />
            <span>Microboard</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/create" className="rounded-md px-3 py-2 hover:bg-accent">
              Create
            </Link>
            <Link to="/dashboard" className="rounded-md px-3 py-2 hover:bg-accent">
              Dashboard
            </Link>
            <Link to="/showcase" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground">
              Showcase
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
