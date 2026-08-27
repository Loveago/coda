// Ambient type declarations for non-TypeScript asset imports.
//
// Plain (non-module) CSS imports such as `import './globals.css'` have no
// type declarations out of the box. Newer TypeScript versions report
// TS2882 ("Cannot find module or type declarations for side-effect import")
// for them. This declaration lets those imports resolve.
//
// Note: `*.module.css` / `*.module.scss` / `*.module.sass` keep their typed
// declarations from `next/types/global` because more specific wildcard
// patterns always take precedence over this one.

declare module '*.css';
