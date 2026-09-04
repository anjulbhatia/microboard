import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { useBoard, WIDGET_PRESETS, WIDGET_TYPES } from "@/lib/board-store";
import { Btn } from "@/components/canvas/controls";
import { selectCls } from "@/components/canvas/StepForm";
import { clampSpan, WIDGET_REGISTRY } from "@/widgets/registry";
import type { WidgetBuilderProps } from "@/app/create/interface";
import type { WidgetType } from "@/types/board";

export function WidgetBuilder({ columns, hasData, chartOnly, gridCols }: WidgetBuilderProps) {
  const addWidget = useBoard((s) => s.addWidget);
  const kinds = WIDGET_TYPES.filter((t) => WIDGET_REGISTRY[t.value].needsData === chartOnly);
  const [wType, setWType] = useState<WidgetType>(kinds[0]?.value ?? "textbox");
  const [wX, setWX] = useState("");
  const [wY, setWY] = useState("");
  const [preset, setPreset] = useState(1);
  const meta = WIDGET_REGISTRY[wType] ?? WIDGET_REGISTRY.textbox;

  const pickType = (t: WidgetType) => {
    setWType(t);
  };

  const submit = () => {
    if (meta.needsData && !hasData) return;
    const x = wX || columns[0] || "";
    const y = wY || columns[0] || "";
    const span = clampSpan(wType, preset < 0 ? meta.defaultSpan : WIDGET_PRESETS[preset], gridCols);
    addWidget({
      type: wType,
      title: meta.needsData ? `${meta.label} · ${y || x}` : meta.defaults.title,
      x: meta.needsData ? x : undefined,
      y: meta.needsData ? y : undefined,
      w: span.w,
      h: span.h,
      props: { ...meta.defaults.props },
    });
  };

  return (
    <div className="space-y-2">
      <select value={wType} onChange={(e) => pickType(e.target.value as WidgetType)} className={selectCls} aria-label="Widget type">
        {kinds.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      {meta.needsData && wType !== "table" && (
        <div className="flex gap-2">
          <select value={wX} onChange={(e) => setWX(e.target.value)} className={selectCls} aria-label="X column">
            <option value="">x: auto</option>
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={wY} onChange={(e) => setWY(e.target.value)} className={selectCls} aria-label="Y column">
            <option value="">y: auto</option>
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}
      <select value={preset} onChange={(e) => setPreset(Number(e.target.value))} className={selectCls} aria-label="Widget size">
        <option value={-1}>Default ({meta.defaultSpan.w}×{meta.defaultSpan.h})</option>
        {WIDGET_PRESETS.map((s, i) => (
          <option key={s.label} value={i}>{s.label}</option>
        ))}
      </select>
      <Btn primary onClick={submit} className="w-full">
        <span className="inline-flex items-center justify-center gap-1">
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} />
          Add {chartOnly ? "chart" : "widget"}
        </span>
      </Btn>
    </div>
  );
}
