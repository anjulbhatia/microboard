import { newId, type WidgetType } from "@microboard/core";

export interface TransformProposal {
  id: string;
  kind: "transform";
  baseVersion: number;
  createdAt: string;
  payload: {
    type: string;
    params: Record<string, unknown>;
    description?: string;
  };
}

export interface WidgetProposal {
  id: string;
  kind: "widget";
  baseVersion: number;
  createdAt: string;
  payload: {
    type: WidgetType;
    title?: string;
    x?: string;
    y?: string;
    y2?: string;
    props?: Record<string, unknown>;
    w?: number;
    h?: number;
  };
}

export type Proposal = TransformProposal | WidgetProposal;

const proposals = new Map<string, Proposal>();
const MAX_PROPOSALS = 100;

export function createProposal<T extends Proposal>(proposal: Omit<T, "id" | "createdAt">): T {
  const id = newId();
  const created = { ...proposal, id, createdAt: new Date().toISOString() } as T;
  proposals.set(id, created);
  if (proposals.size > MAX_PROPOSALS) {
    const oldest = proposals.keys().next().value;
    if (oldest) proposals.delete(oldest);
  }
  return created;
}

export function getProposal(id: string): Proposal | undefined {
  return proposals.get(id);
}

export function consumeProposal(id: string): void {
  proposals.delete(id);
}

export function clearProposals(): void {
  proposals.clear();
}
