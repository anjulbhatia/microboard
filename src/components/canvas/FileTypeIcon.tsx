"use client";

import { FileIcon } from "@untitledui/file-icons";
import { useTheme } from "next-themes";

export type FileKind = "csv" | "excel" | "clipboard" | "sheet";

const TYPES: Record<FileKind, string> = {
  csv: "csv",
  excel: "xlsx",
  clipboard: "txt",
  sheet: "spreadsheets",
};

export function FileTypeIcon({ kind, size = 44 }: { kind: FileKind; size?: number }) {
  const { resolvedTheme } = useTheme();
  return (
    <span className="inline-flex shrink-0" role="img" aria-label={`${kind} file`}>
      <FileIcon type={TYPES[kind]} size={size} theme={resolvedTheme === "dark" ? "dark" : "light"} />
    </span>
  );
}
