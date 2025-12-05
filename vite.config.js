import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindVite from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

// recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsxShim = path.resolve(__dirname, "public/shims/react-jsx-runtime.js");

export default defineConfig({
  plugins: [
    // tailwindVite plugin should run before other plugins that transform CSS
    tailwindVite(),
    react({
      jsxRuntime: "classic",
      babel: { presets: [], plugins: [] },
    }),
  ],
  optimizeDeps: {
    include: [],
    exclude: ["react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  resolve: {
    alias: {
      "react/jsx-runtime": jsxShim,
      "react/jsx-dev-runtime": jsxShim,
    },
  },
});
