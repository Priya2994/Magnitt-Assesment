# Magnitt Assessment — Charts App

This project contains D3-based React chart components used in the assessment:

- `SingleStackedChart` — stacked bars (Regular + Mega) with a curved deals series and per-bar total labels.
- `GroupedChart` — grouped stacked bars per country/year with per-country deals curves and a dynamic top-centered legend.

This README explains how to get the repository running locally using the provided package.json, how the charts expect data, and a few implementation notes (tooltip helper, money formatter, React compatibility, Tailwind).

---

## Quick start (based on package.json)

Your package.json contains the following scripts:

- `dev` — start Vite dev server
- `build` — build for production
- `preview` — preview the built output
- `lint` — run ESLint

Install dependencies and run locally:

- Install:

  - npm:
    npm install
  - yarn:
    yarn

- Start dev server:
  npm run dev

  # or

  yarn dev

- Build:
  npm run build

- Preview build:
  npm run preview

- Lint:
  npm run lint

Note: The project uses Vite and React. The installed React version in package.json is `16.8.6` (hooks were introduced in 16.8). The chart components use hooks (`useEffect`, `useRef`) and will work with React >= 16.8. If you plan to use Next.js app directory features or the `use client` directive, prefer React 18+.

---

## package.json (important deps)

Key dependencies in the provided package.json:

- d3: ^7.8.5
- react: 16.8.6
- react-dom: 16.8.6
- tailwindcss, @tailwindcss/vite (optional)

Dev dependencies include Vite, ESLint and PostCSS tooling.

If you upgrade React to 17/18, ensure other packages and ESLint configs remain compatible.

---

## Project structure (recommended)

Place components and helpers like:

- src/
  - components/
    - SingleStackedChart.jsx
    - GroupedChart.jsx
  - hooks/
    - useTooltip.js
  - utils/
    - commonfunction.js (export fmtMoney)
  - App.jsx (demo / pages)

---

## Data shape (examples)

SingleStackedChart expects `rawData` array shaped like:

[
{
year: 2020,
total_amount_raised_regular_deals: 150000000,
total_amount_raised_mega_deals: 3300000000,
total_amount_raised: 3450000000, // optional override
num_of_deals: 95
},
...
]

GroupedChart expects `data` array and `countries` list:

data = [
{
year: 2020,
regular: { KSA: 150000000, UAE: 200000000, Singapore: 220000000 },
mega: { KSA: 2700000000, UAE: 2000000000, Singapore: 2100000000 },
values: { KSA: 2850000000 }, // optional explicit totals per country
counts: { KSA: 95, UAE: 147, Singapore: 20 }
},
...
];

countries = ["KSA", "UAE", "Singapore"];

colors mapping (optional):
colors = { KSA: "#16a34a", UAE: "#f59e0b", Singapore: "#7c3aed" };

---

## Helper utilities

Two small helpers are expected by the components:

1. fmtMoney(number) — returns a short formatted string for amounts, e.g.:

- 1200000000 -> "$1.2B"
- 812000000 -> "$812M"
  Implementation (example):

```js
// src/utils/commonfunction.js
export function fmtMoney(n) {
  if (n == null) return "";
  if (Math.abs(n) >= 1e9)
    return `$${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (Math.abs(n) >= 1e6) return `$${Math.round(n / 1e6)}M`;
  if (Math.abs(n) >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${n}`;
}
```

2. useTooltip() — a simple hook that shows/hides a floating HTML tooltip element.

Minimal example:

```js
// src/hooks/useTooltip.js
import { useCallback } from "react";

export default function useTooltip() {
  const showTooltip = useCallback((event, html) => {
    const el = document.getElementById("tooltip");
    if (!el) return;
    el.innerHTML = html;
    el.style.display = "block";
    const x = (event.clientX || event.pageX) + 12;
    const y = (event.clientY || event.pageY) + 12;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, []);

  const hideTooltip = useCallback(() => {
    const el = document.getElementById("tooltip");
    if (!el) return;
    el.style.display = "none";
  }, []);

  return { showTooltip, hideTooltip };
}
```

Add an element in your root HTML (or App component):

```html
<div
  id="tooltip"
  style="position:fixed;pointer-events:none;display:none;background:white;padding:8px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.12);z-index:9999;"
></div>
```

You can style it with a CSS file or Tailwind.

---

## Notes & recommendations

- "use client" directive:

  - Some example components include `use client` at the top (for Next.js app router). This directive is ignored in plain Vite apps; if you upgrade to Next.js+app router, keep it. If not using Next, you can remove that line.

- React version:

  - package.json contains React 16.8.6 which supports hooks. If you upgrade to React 18, make sure to test components again and update tooling.

- Tailwind:

  - Tailwind config & PostCSS are present in devDependencies. If you plan to use Tailwind classes, ensure `tailwind.config.js` and PostCSS configuration exist and are correct for Vite.

- Linting:

  - ESLint config is not provided in this README — ensure you have an `.eslintrc` compatible with your React version (plugins for hooks, jsx).

- Performance:
  - The charts are drawn imperatively on mount/update using D3. For very large datasets or frequent updates, consider throttling re-renders or switching to lightweight render strategies.
