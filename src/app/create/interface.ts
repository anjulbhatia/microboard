import type { ReactNode } from "react";
import type { ColumnMeta, Widget } from "@/types/board";
import type { StageBackdrop, StageRatio } from "@/components/canvas/Stage";

export type DockTab = "visualize" | "transform";

export interface Upload {
  id: string;
  url: string;
  name: string;
}

export interface CreateLayoutProps {
  title: string;
  onTitle: (title: string) => void;
  tab: DockTab;
  onTab: (tab: DockTab) => void;
  panelOpen: boolean;
  panel: ReactNode;
  agentPanel: ReactNode;
  children: ReactNode;
}

export interface WidgetCardProps {
  widget: Widget;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
}

export interface StepFormProps {
  columns: string[];
}

export interface WidgetBuilderProps {
  columns: string[];
  hasData: boolean;
  chartOnly: boolean;
  gridCols: number;
}

export interface VisualsPanelProps {
  columns: string[];
  hasData: boolean;
  builderMode: "widget" | "chart";
  onBuilderMode: (mode: "widget" | "chart") => void;
  uploads: Upload[];
  onAddUploads: (files: FileList | null) => void;
  backdrop: StageBackdrop;
  onBackdrop: (b: StageBackdrop) => void;
  ratio: StageRatio;
  onRatio: (r: StageRatio) => void;
  gridCols: number;
}

export interface TransformPanelProps {
  rawCols: string[];
  hasData: boolean;
}

export interface AgentPanelProps {
  goal: string;
  onGoal: (goal: string) => void;
}

export interface PageStripProps {
  ratio: StageRatio;
  onRatio: (r: StageRatio) => void;
  cleanedCount: number;
  usedCells: number;
  capacity: number;
}

export interface UploadPhaseProps {
  onLoad: (source: "inline" | "file" | "sample", records: Record<string, string>[]) => void;
}

export interface DataLandedModalProps {
  columns: ColumnMeta[];
  rows: number;
  onQuickClean: () => void;
  onClose: () => void;
}
