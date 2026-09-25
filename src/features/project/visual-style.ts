export const VISUAL_STYLE_OPTIONS = [
  { value: "paper_motion", label: "Paper Effect + Motion Graphics" },
  { value: "split_wise", label: "Split-Wise B-Roll Editing" },
] as const;

export type VisualStyle = (typeof VISUAL_STYLE_OPTIONS)[number]["value"];

export function visualStyleLabel(style: VisualStyle) {
  return VISUAL_STYLE_OPTIONS.find((option) => option.value === style)?.label ?? style;
}
