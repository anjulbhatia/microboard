import type { ReactNode } from "react";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
