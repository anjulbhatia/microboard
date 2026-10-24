export * from "@/features/data/providers/types";
export * from "@/features/data/providers/csv";
export * from "@/features/data/providers/excel";
export * from "@/features/data/providers/sheet";
export * from "@/features/data/providers/clipboard";

export type ProviderKind = "csv" | "excel";

export function providerForFile(name: string): ProviderKind {
  if (/\.xlsx$/i.test(name)) return "excel";
  if (/\.csv$/i.test(name)) return "csv";
  throw new Error("Unsupported file type. Drop a .csv or .xlsx file.");
}
