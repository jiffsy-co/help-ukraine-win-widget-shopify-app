import { useEffect, useRef } from "react";

export default function Preview({ type, position, collapsedByDefault }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) {
      const doc = ref.current.contentDocument;
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
        `https://helpukrainewinwidget.org/cdn/widget.js?type=${encodeURIComponent(
          type
        )}&position=${encodeURIComponent(
          position
        )}&collapsed=${encodeURIComponent(collapsedByDefault)}`
      );
      script.setAttribute("data-type", type);
      script.setAttribute("data-position", position);
      script.setAttribute("data-collapsed", collapsedByDefault);
      doc.body.appendChild(script);
    }
  }, [type, position, collapsedByDefault]);
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
