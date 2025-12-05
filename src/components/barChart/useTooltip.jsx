import { useEffect } from "react";

export default function useTooltip() {
  // create tooltip when used
  useEffect(() => {
    const el = document.createElement("div");
    el.className = "magnitt-tooltip";
    Object.assign(el.style, {
      position: "absolute",
      pointerEvents: "none",
      background: "rgba(0,0,0,0.75)",
      color: "#fff",
      padding: "6px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      display: "none",
      zIndex: 9999,
    });
    document.body.appendChild(el);

    return () => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  const showTooltip = (event, html) => {
    const el = document.querySelector(".magnitt-tooltip");
    if (!el) return;
    el.innerHTML = html;
    el.style.display = "block";
    el.style.left = `${event.pageX + 10}px`;
    el.style.top = `${event.pageY - 28}px`;
  };

  const hideTooltip = () => {
    const el = document.querySelector(".magnitt-tooltip");
    if (!el) return;
    el.style.display = "none";
  };

  return { showTooltip, hideTooltip };
}
