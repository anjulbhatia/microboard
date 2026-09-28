import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * Shared home design language: minimal flat modules.
 * No shadows/gradients — thin boxes, dividers, tight type.
 */

export { Box, FlatRow, EmptyBox as Empty, GhostBtn } from "@/shared/components/surface";
export { ModuleHead as SectionHead } from "@/shared/components/surface";
export { StatTile as Stat } from "@/shared/components/surface";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border/60 bg-card p-4 ${className}`}>{children}</div>;
}

/** Compact icon button, flat. */
export function IconBtn({
  label,
  onClick,
  icon,
  danger,
  active,
  disabled,
}: {
  label: string;
  onClick: () => void;
  icon: typeof import("@hugeicons/core-free-icons").Home01Icon;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
        danger
          ? "text-muted-foreground hover:bg-muted hover:text-destructive"
          : active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <HugeiconsIcon icon={icon} size={15} strokeWidth={1.5} />
    </button>
  );
}
