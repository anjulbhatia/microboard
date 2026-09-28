import type { Dataset, OpDef } from "@/features/data/ops/types";
import { getDataOp } from "@/features/data/ops/get-data";
import { transformDataOp } from "@/features/data/ops/transform-data";
import { inspectDataOp } from "@/features/data/ops/inspect-data";
import { parseInline } from "@/features/data/ops/inline";

export * from "@/features/data/ops/types";
export * from "@/features/data/ops/inline";

const REGISTRY = new Map<string, OpDef>([
  [getDataOp.name, getDataOp],
  [transformDataOp.name, transformDataOp],
  [inspectDataOp.name, inspectDataOp],
]);

export function opNames(): string[] {
  return [...REGISTRY.keys()];
}

export function opSpecs(): Pick<OpDef, "name" | "description" | "params">[] {
  return [...REGISTRY.values()].map(({ name, description, params }) => ({ name, description, params }));
}

/** In-function form: runOp("get_data", { type: "csv", text }) */
export async function runOp(name: string, args: Record<string, unknown> = {}): Promise<Dataset> {
  const op = REGISTRY.get(name);
  if (!op) throw new Error(`Unknown op "${name}". Available: ${opNames().join(", ")}.`);
  return op.run(args);
}

/** Inline form: runInline('get_data --type csv --text "..."') */
export async function runInline(cmd: string): Promise<Dataset> {
  const { name, args } = parseInline(cmd);
  return runOp(name, args);
}
