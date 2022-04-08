import { useEffect, useRef } from "react";
import { IWidgetOptions, PREVIEW_WIDGET_JS_SRC } from "../types";

const sliderDisabledPersistenceStorageKey = "huww-slider-disabled-persistence";

export default function Preview({
  type,
  position,
  layout,
  domain,
}: IWidgetOptions) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      const doc = ref.current.contentDocument;
      if (ref.current.contentWindow) {
        (ref.current
          .contentWindow as any).__HELPUKRAINEWIDGET_DISABLE_ANALYICS = true;
        (ref.current
          .contentWindow as any).__HELPUKRAINEWIDGET_DISABLE_PERSISTENCE = true;
      }
      if (!doc) {
        return;
      }
      doc.body.innerHTML = "";
      doc.body.style.margin = "0";
      // conatiner
      const container = doc.createElement("div");
      container.style.setProperty("--border-color", "#bfbfbf");
      container.innerHTML = `
        <div style="
            height: 50%;
            display: flex;
            border-bottom: 1px dashed var(--border-color, gray);
            box-sizing: border-box;
        ">
            <div style="
                flex-grow: 1;
                border-right: 1px dashed var(--border-color, gray);
                box-sizing: border-box;
            "></div>
                <div style="
                    flex-grow: 1;
                "></div>
            </div>
        <div style="
            height: 50%;
            display: flex;
        ">
            <div style="
                flex-grow: 1;
                border-right: 1px dashed var(--border-color, gray);
                box-sizing: border-box;
            "></div>
                    <div style="
                flex-grow: 1;
            "></div>
        </div>
    `;
      doc.body.appendChild(container);
      // script
      const script = doc.createElement("script");
      script.setAttribute("async", "");
      script.setAttribute("id", "help-ukraine-win");
      script.setAttribute(
        "src",
        `${PREVIEW_WIDGET_JS_SRC}?type=${encodeURIComponent(
          type
        )}&position=${encodeURIComponent(position)}&layout=${encodeURIComponent(
          layout
        )}&domain=${encodeURIComponent(domain)}`
      );
      script.setAttribute("data-type", type);
      script.setAttribute("data-position", position);
      script.setAttribute("data-layout", layout);
      script.setAttribute("data-domain", domain);
      doc.body.appendChild(script);
    }
  }, [type, position, layout, domain]);
  return (
    <iframe
      key={`${type}/${position}`}
      ref={ref}
      sandbox="allow-scripts allow-same-origin allow-popups"
      style={{
        width: "100%",
        height: 400,
        border: "none",
        minWidth: 465,
      }}
    ></iframe>
  );
}
