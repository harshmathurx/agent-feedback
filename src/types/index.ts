export type Annotation = {
  id: string;
  x: number; // % of viewport width
  y: number; // px from top (viewport if fixed)
  comment: string;
  element: string; // e.g., "Button"
  elementPath: string; // e.g., "body > div > button"
  timestamp: number;

  // Optional metadata
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  nearbyElements?: string;
  computedStyles?: string;
  fullPath?: string;
  accessibility?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
};

export type OutputDetailLevel = "compact" | "standard" | "detailed" | "forensic";

export type ToolbarSettings = {
  outputDetail: OutputDetailLevel;
  autoClearAfterCopy: boolean;
  annotationColor: string;
  blockInteractions: boolean;
};

export type AnnotationMode = "click" | "text" | "multiselect" | "area";

export const DEFAULT_SETTINGS: ToolbarSettings = {
  outputDetail: "standard",
  autoClearAfterCopy: false,
  annotationColor: "#3c82f7",
  blockInteractions: false,
};
