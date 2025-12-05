// Shim module to satisfy imports of `react/jsx-runtime` and `react/jsx-dev-runtime`.
// Delegates to React.createElement so it works with "classic" JSX transform (React 16).
import React from "react";

export const jsx = (type, props, key) =>
  React.createElement(type, { ...props, key });
export const jsxs = (type, props, key) =>
  React.createElement(type, { ...props, key });
export const jsxDEV = (type, props, key) =>
  React.createElement(type, { ...props, key });
export const Fragment = React.Fragment;

export default {};
