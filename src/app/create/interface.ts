import type { ReactNode } from "react";
import type { Widget } from "@/types/board";
import type { StageRatio } from "@/components/canvas/Stage";

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
  onPanelToggle: () => void;
  toolbar?: ReactNode;
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
  uploads: Upload[];
  onAddUploads: (files: FileList | null) => void;
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

