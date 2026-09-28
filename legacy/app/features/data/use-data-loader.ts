import { useState } from "react";
import { useBoard } from "@/store/board";
import { csvRecords } from "@/features/data/providers/csv";
import { clipboardFromText } from "@/features/data/providers/clipboard";
import { excelFromFile } from "@/features/data/providers/excel";
import { sheetFromUrl } from "@/features/data/providers/sheet";
import { toRecords } from "@/features/data/providers/types";
import { SAMPLE_CSV } from "@/features/data/lib/data-utils";
import { fetchApiRecords, MAX_INGEST_BYTES } from "@/features/data/sources";
import { providerForFile } from "@/features/data/providers";
import type { DataSource } from "@/features/board/types";

/**
 * Shared data-loading actions for upload surfaces (canvas toolbox,
 * Data Sources tab). Loads straight into the board store.
 */
export function useDataLoader() {
  const loadData = useBoard((s) => s.loadData);
  const setSourceConfig = useBoard((s) => s.setSourceConfig);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = (source: DataSource, rows: Record<string, string>[]) => {
    if (rows.length === 0) throw new Error("No rows found.");
    loadData(source, rows);
  };

  const clear = () => setError("");

  const loadFile = async (files: FileList | null): Promise<boolean> => {
    const file = files?.[0];
    if (!file) return false;
    setError("");
    // Read-before-parse: reject huge files instead of freezing the tab.
    if (file.size > MAX_INGEST_BYTES) {
      setError("File is too large (>10MB). Trim it or load via API.");
      return false;
    }
    setBusy(true);
    try {
      if (providerForFile(file.name) === "excel") {
        load("file", toRecords(await excelFromFile(file)));
      } else {
        load("file", csvRecords(await file.text()));
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const loadPaste = (text: string): boolean => {
    setError("");
    try {
      if (!text.trim()) throw new Error("Paste some rows first.");
      load("inline", toRecords(clipboardFromText(text)));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      return false;
    }
  };

  const loadSheet = async (url: string): Promise<boolean> => {
    setError("");
    if (!url.trim()) {
      setError("Paste a public sheet link.");
      return false;
    }
    setBusy(true);
    try {
      load("sheet", toRecords(await sheetFromUrl(url.trim())));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const loadApi = async (url: string): Promise<boolean> => {
    setError("");
    if (!url.trim()) {
      setError("Paste a JSON endpoint.");
      return false;
    }
    setBusy(true);
    try {
      const rows = await fetchApiRecords(url.trim());
      loadData("api", rows);
      setSourceConfig(url.trim(), 0);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const loadSample = (): boolean => {
    setError("");
    try {
      load("sample", csvRecords(SAMPLE_CSV));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      return false;
    }
  };

  return { busy, error, clear, loadFile, loadPaste, loadSheet, loadApi, loadSample };
}
