import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Btn({
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
          ? `rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`
          : `rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 ${className}`
      }
    >
      {children}
    </button>
  );
}

export const inputCls =
  "w-full rounded-md border bg-background px-2 py-1.5 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/** shadcn-styled select with optional empty choice. */
export function CSelect({
  value,
  onChange,
  label,
  options,
  emptyLabel,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { value: string; label: string }[];
  emptyLabel?: string;
  className?: string;
}) {
  const normalized = value === "" ? "__empty" : value;
  return (
    <Select
      value={normalized}
      onValueChange={(v) => onChange(v == null || v === "__empty" ? "" : v)}
    >
      <SelectTrigger aria-label={label} size="sm" className={`w-full ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {emptyLabel && <SelectItem value="__empty">{emptyLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const BRAILLE = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function SaveStatus({ version }: { version: number }) {
  const [saving, setSaving] = useState(false);
  const [frame, setFrame] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaving(true);
    const t = setTimeout(() => setSaving(false), 1000);
    return () => clearTimeout(t);
  }, [version]);

  useEffect(() => {
    if (!saving) return;
    const i = setInterval(() => setFrame((f) => (f + 1) % BRAILLE.length), 80);
    return () => clearInterval(i);
  }, [saving]);

  return (
    <span className="font-mono text-[11px] text-muted-foreground" aria-live="polite">
      {saving ? `${BRAILLE[frame]} Saving` : "● Saved"}
    </span>
  );
}
