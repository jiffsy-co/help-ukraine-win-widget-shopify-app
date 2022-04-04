export const widgetTypes = [
  { label: "One", value: "one" },
  { label: "Two", value: "two" },
  { label: "Three", value: "three" },
  { label: "Four", value: "four" },
] as const;

export const widgetPositions = [
  { label: "Top Left", value: "top-left" },
  { label: "Top Right", value: "top-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Bottom Right", value: "bottom-right" },
  { label: "Middle Right", value: "middle-right" },
  { label: "Middle Left", value: "middle-left" },
] as const;

export const widgetLayouts = [
  { label: "Main", value: "main" },
  { label: "Expanded", value: "expanded" },
  { label: "Collapsed", value: "collapsed" },
] as const;

export interface IWidgetOptions {
  type: typeof widgetTypes[number]["value"];
  position: typeof widgetPositions[number]["value"];
  layout: typeof widgetLayouts[number]["value"];
  domain: string;
}

export const WIDGET_JS_SRC =
  process.env.NEXT_PUBLIC_WIDGET_PATH ||
  "https://helpukrainewinwidget.org/cdn/widget.js";
// export const WIDGET_JS_SRC = "http://localhost:3000/cdn/widget.js";
export const PREVIEW_WIDGET_JS_SRC = process.env.NEXT_PUBLIC_PREVIEW_WIDGET_PATH || WIDGET_JS_SRC; // "http://localhost:3000/cdn/widget.js";
