import { DitherGradient } from '@/shared/components/charts';

export function SiteFooter() {
  return (
    <footer className="relative shrink-0 border-t py-5">
      <DitherGradient from="purple" direction="up" />
      <div className="relative container mx-auto px-4 text-center font-mono text-xs text-muted-foreground">
        <p>clean data · craft microcharts · ship dashboards</p>
      </div>
    </footer>
  );
}
