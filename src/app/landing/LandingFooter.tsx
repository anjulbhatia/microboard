import { Link } from "react-router-dom";
import { DitherGradient } from "@/components/dither-kit/gradient";

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-8 text-center">
        <p className="font-display text-5xl tracking-[0.15em] md:text-6xl">MICROBOARD</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          A collaborative data-to-dashboard workspace. Clean data, craft microcharts,
          ship dashboards — with your agent on the same live canvas.
        </p>
        <div className="mt-5 flex items-center justify-center gap-6 text-sm">
          <Link to="/create" className="font-medium text-primary hover:underline">
            Create
          </Link>
          <Link to="/share" className="text-muted-foreground transition-colors hover:text-foreground">
            Shared
          </Link>
          <Link to="/test" className="text-muted-foreground transition-colors hover:text-foreground">
            Widgets
          </Link>
        </div>
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          clean data · craft microcharts · ship dashboards
        </p>
      </div>
      <div className="relative h-20 overflow-hidden" aria-hidden>
        <DitherGradient from="purple" direction="up" />
      </div>
    </footer>
  );
}
