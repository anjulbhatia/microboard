import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * Home kit v2 — fresh build. One radius scale, one border tone,
 * tabular numerals, quiet type. Panels consume these names.
 */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function Box({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card ${className}`}>{children}</div>;
}

export function FlatRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] ${className}`}>
      {children}
    </div>
  );
}

export function SectionHead({
  title,
  blurb,
  actions,
}: {
  title: string;
  blurb?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        {blurb && <p className="mt-1 text-[13px] text-muted-foreground">{blurb}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export { SectionHead as ModuleHead };

export function Stat({
  value,
  label,
  icon,
}: {
  value: string | number;
  label: string;
  icon?: typeof import("@hugeicons/core-free-icons").Home01Icon;
}) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon && <HugeiconsIcon icon={icon} size={13} strokeWidth={1.5} />}
        <p className="text-[11px] font-medium tracking-wide uppercase">{label}</p>
      </div>
      <p className="mt-1 text-[22px] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

export { Stat as StatTile };

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export { Empty as EmptyBox };

export function GhostBtn({
  children,
  onClick,
  primary,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? `rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`
          : `rounded-lg px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 ${className}`
      }
    >
      {children}
    </button>
  );
}

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
      className={`flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
        danger
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <HugeiconsIcon icon={icon} size={15} strokeWidth={1.5} />
    </button>
  );
}
