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

Note: The project uses Vite and React. The installed React version in package.json is `16.8.6` (hooks were introduced in 16.8). The chart components use hooks (`useEffect`, `useRef`) and will work with React >= 16.8.

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

## Notes & recommendations

- "use client" directive:

  - Some example components include `use client` at the top (for Next.js app router). This directive is ignored in plain Vite apps; if you upgrade to Next.js+app router, keep it. If not using Next, you can remove that line.

- React version:

  - package.json contains React 16.8.6 which supports hooks. If you upgrade to React 18, make sure to test components again and update tooling.

- Tailwind:

  - Tailwind config & PostCSS are present in devDependencies. If you plan to use Tailwind classes, ensure `tailwind.config.js` and PostCSS configuration exist and are correct for Vite.

- Performance:
  - The charts are drawn imperatively on mount/update using D3. For very large datasets or frequent updates, consider throttling re-renders or switching to lightweight render strategies.
