/* =========================================================
   Night Garden: what the scene shows
   The name, the message pages, the tap hint and the flower colour.

   Embedded in a gift page, the host sends them with postMessage
   once this page says it is ready (see components/scene/scene-frame.tsx).
   Opened on its own, the defaults below are used.
   ========================================================= */

(() => {
  "use strict";

  /* Flower colours. `petal` runs from the heart of the flower to its edge;
     `fall` is a loose petal's top and underside. Keys match FLOWER_COLORS in
     features/gifts/scene.ts. */
  const FLOWERS = {
    white: {
      petal: ["#f2e4bf", "#fbf4e2", "#fffdf7", "#ffffff"],
      blush: "#ff8fb8", stroke: "#f4c3d6", vein: "#f0c9d8",
      bud: ["#ffffff", "#fbf3df", "#e6d8b4"], fall: ["#fffdf7", "#efe4c8"],
    },
    pink: {
      petal: ["#f48fb1", "#f9b3cb", "#fdd3e1", "#ffeaf2"],
      blush: "#ff4f93", stroke: "#ee8fb0", vein: "#f2a9c4",
      bud: ["#fff0f6", "#fdd3e1", "#f2a3c0"], fall: ["#ffdbe8", "#f6a9c5"],
    },
    yellow: {
      petal: ["#f2b632", "#f8d264", "#fde9a0", "#fff8d6"],
      blush: "#ff9d3c", stroke: "#eec25a", vein: "#f1d284",
      bud: ["#fffbe6", "#fde9a0", "#e9c35c"], fall: ["#fff0b0", "#f2cc5c"],
    },
    lavender: {
      petal: ["#a98be8", "#c3aef2", "#ded1fa", "#f4eeff"],
      blush: "#b06cf5", stroke: "#b29be9", vein: "#c7b6f1",
      bud: ["#f7f2ff", "#ded1fa", "#b9a2ea"], fall: ["#e6dbfc", "#bfa9ee"],
    },
    red: {
      petal: ["#c9304f", "#e0566f", "#f08a9c", "#fcc0cb"],
      blush: "#ff2d62", stroke: "#c2334f", vein: "#de7a8e",
      bud: ["#fcc0cb", "#f08a9c", "#cf4b65"], fall: ["#f7a3b2", "#d9506b"],
    },
    blue: {
      petal: ["#6aa9ea", "#96c4f3", "#c5e0fa", "#edf6ff"],
      blush: "#5b9cff", stroke: "#86b6ec", vein: "#a9cdf3",
      bud: ["#f0f8ff", "#c5e0fa", "#8fbdee"], fall: ["#d3e8fc", "#96c4f3"],
    },
  };

  const DEFAULTS = {
    name: "My Dear",
    // Each page is a few short lines, typed out one after the other. The last page stays.
    pages: [
      ["Take a little break with me", "and watch these flowers bloom 🌸"],
      ["Every single one of them", "bloomed just for you"],
    ],
    tapHint: "tap anywhere to bloom more flowers 🌸",
    flower: "white",
  };

  const text = (value, max) => (typeof value === "string" ? value.slice(0, max) : "");

  /* Takes only what the scene knows, with sane sizes, whatever the host sent. */
  function normalise(raw) {
    const input = raw && typeof raw === "object" ? raw : {};
    const pages = Array.isArray(input.pages)
      ? input.pages
          .slice(0, 12)
          .map((page) => (Array.isArray(page) ? page.slice(0, 4).map((line) => text(line, 300)).filter(Boolean) : []))
          .filter((page) => page.length > 0)
      : DEFAULTS.pages;
    return {
      name: typeof input.name === "string" ? text(input.name, 80) : DEFAULTS.name,
      pages,
      tapHint: typeof input.tapHint === "string" ? text(input.tapHint, 120) : DEFAULTS.tapHint,
      flower: Object.prototype.hasOwnProperty.call(FLOWERS, input.flower) ? input.flower : DEFAULTS.flower,
    };
  }

  /* The host's own fonts: its @font-face rules, and which families to use. */
  function applyFonts(fonts) {
    if (!fonts || typeof fonts !== "object") return;
    if (typeof fonts.css === "string" && fonts.css) {
      const style = document.createElement("style");
      style.textContent = fonts.css;
      document.head.appendChild(style);
    }
    const root = document.documentElement.style;
    if (typeof fonts.body === "string" && fonts.body) root.setProperty("--font-body", fonts.body);
    if (typeof fonts.script === "string" && fonts.script) root.setProperty("--font-script", fonts.script);
  }

  const embedded = window.parent !== window;

  const scene = {
    config: normalise(null),
    palette() {
      return FLOWERS[this.config.flower];
    },
    /* Resolves once the scene knows what to show. */
    ready: new Promise((resolve) => {
      if (!embedded) {
        resolve();
        return;
      }
      const onMessage = (e) => {
        // Only the page that embeds this one, on this site, may configure it.
        if (e.origin !== window.location.origin || e.source !== window.parent) return;
        if (!e.data || e.data.type !== "eain:scene-config") return;
        window.removeEventListener("message", onMessage);
        clearInterval(asking);
        scene.config = normalise(e.data.config);
        applyFonts(e.data.fonts);
        resolve();
      };
      window.addEventListener("message", onMessage);
      // Ask until answered: this page can finish loading before the host is listening.
      const ask = () => window.parent.postMessage({ type: "eain:scene-ready" }, window.location.origin);
      const asking = setInterval(ask, 400);
      ask();
    }),
  };

  window.Scene = scene;
})();
