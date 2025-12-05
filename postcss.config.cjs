module.exports = {
  plugins: [
    // Use the Tailwind v4 PostCSS plugin package
    require("@tailwindcss/postcss")(),
    // Autoprefixer still useful for vendor prefixes
    require("autoprefixer")(),
  ],
};
