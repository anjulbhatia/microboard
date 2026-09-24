import { useEffect, useReducer } from "react";
import { rasterStageThumb } from "@/features/board/lib/export-board";

/**
 * Live minimap feed. Captures the real stage (html-to-image, same raster
 * path as exports) debounced after board edits, cached per page. Pages
 * that were never active show no thumb — callers fall back to blocks.
 */

interface Thumb {
  version: number;
  url: string;
}

const cache = new Map<string, Thumb>();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let pending: { id: string; version: number } | null = null;

function emit(): void {
  for (const fn of listeners) fn();
}

async function capture(): Promise<void> {
  const job = pending;
  pending = null;
  if (!job) return;
  try {
    const url = await rasterStageThumb(224);
    const cur = cache.get(job.id);
    if (!cur || cur.version <= job.version) {
      cache.set(job.id, { version: job.version, url });
      emit();
    }
  } catch {
    // Raster failed (fonts, taint) — keep the block fallback.
  }
}

function schedule(id: string, version: number): void {
  pending = { id, version };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void capture(), 700);
}

/** Live thumb URL for a page, or null. watch=null disables capture. */
export function usePageThumb(pageId: string, watch: number | null): string | null {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  useEffect(() => {
    if (watch === null) return;
    const hit = cache.get(pageId);
    if (hit && hit.version === watch) return;
    schedule(pageId, watch);
  }, [pageId, watch]);
  return cache.get(pageId)?.url ?? null;
}
