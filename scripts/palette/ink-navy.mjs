/*
  Ink Navy palette generator (9 Nov 2026).

  Writes styles/palette.css: the colour foundation for the whole prototype,
  in three layers.
    1. Primitives: OKLCH ramps (blue, sky, neutral, green, amber, red), 50–950.
    2. Semantic tokens, named property-first (background/*, foreground/*,
       border/*, accent/*), for light and dark.
    3. The app's existing names (shadcn HSL triplets, --pi-*, badges, status,
       chart, palette, nav) pointed at the semantic layer, so no component
       has to change to pick the palette up.

  Run: node scripts/palette/ink-navy.mjs   (then the dev server hot-reloads)
  Every text/background pair used for reading is checked against WCAG AA
  (4.5:1) and the run fails if one drops below.
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../../styles/palette.css");

/* ------------------------------------------------------------- colour math */
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp = (v) => Math.min(1, Math.max(0, v));
function oklch(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return "#" + rgb.map((v) => Math.round(clamp(fromLin(clamp(v))) * 255).toString(16).padStart(2, "0")).join("");
}
const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const lum = (hex) => { const [r, g, b] = rgbOf(hex).map((v) => toLin(v / 255)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function hsl(hex) {
  let [r, g, b] = rgbOf(hex).map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let H = 0, S = 0; const L = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    S = L > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    H = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    H *= 60;
  }
  return `${+H.toFixed(1)} ${+(S * 100).toFixed(1)}% ${+(L * 100).toFixed(1)}%`;
}
const rgbTriplet = (hex) => rgbOf(hex).join(" ");

/* -------------------------------------------------------------- primitives */
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L_RAMP = [0.975, 0.948, 0.895, 0.82, 0.71, 0.6, 0.52, 0.45, 0.38, 0.3, 0.23];
const C_SHAPE = [0.12, 0.22, 0.42, 0.65, 0.88, 1, 1, 0.95, 0.85, 0.72, 0.6];
const ramp = (h, c, L = L_RAMP) => Object.fromEntries(STEPS.map((s, i) => [s, oklch(L[i], c * C_SHAPE[i], h)]));
const NEUTRAL_L = [0.985, 0.965, 0.925, 0.87, 0.72, 0.58, 0.48, 0.4, 0.32, 0.25, 0.19];
const neutralRamp = (h, c) => ({
  0: "#ffffff",
  ...Object.fromEntries(STEPS.map((s, i) => [s, oklch(NEUTRAL_L[i], c * (i < 4 ? 0.6 : 1), h)])),
  1000: oklch(0.13, c, h),
});

const HUE = 268; // Ink Navy: a royal blue leaning a touch to violet.
const P = {
  blue: ramp(HUE, 0.16),
  sky: ramp(240, 0.12), // the second blue: secondary series, "manual" states, email
  neutral: neutralRamp(262, 0.02),
  green: ramp(152, 0.14),
  amber: ramp(68, 0.15),
  red: ramp(27, 0.19),
};
// Dark surfaces sit on the brand hue, low chroma.
const D = (L, C = 0.028, h = 266) => oklch(L, C, h);

/* ---------------------------------------------------------------- semantic */
const b = P.blue, s = P.sky, n = P.neutral, g = P.green, a = P.amber, r = P.red;
const light = {
  // backgrounds
  "background-page": "#ffffff",
  "background-card": "#ffffff",
  "background-elevated": "#ffffff",
  "background-input": "#ffffff",
  "background-sunken": n[100],
  "background-fill": n[100],
  "background-fill-strong": n[200],
  "background-header": n[50],
  "background-row-hover": n[50],
  "background-selected": b[50],
  "background-disabled": n[100],
  "background-inverse": b[950],
  "background-inverse-muted": b[900],
  "background-brand": b[700],
  "background-brand-subtle": b[50],
  "background-action": b[700],
  "background-action-hover": b[800],
  "background-action-pressed": b[900],
  "background-ai": b[50],
  "background-secondary-series": s[50],
  "background-success": g[50],
  "background-warning": a[50],
  "background-error": r[50],
  "background-info": b[50],
  "background-destructive": r[700],
  "background-destructive-hover": r[800],
  "background-nav-top": b[50],
  "background-nav-bottom": b[50],
  "background-nav-hover": oklch(0.955, 0.022, HUE),
  "background-nav-active": b[100],
  "border-nav": b[100],
  // foregrounds
  "foreground-primary": n[900],
  "foreground-strong": n[800],
  "foreground-secondary": n[700],
  "foreground-tertiary": n[600],
  "foreground-disabled": n[400],
  "foreground-inverse": "#ffffff",
  "foreground-inverse-muted": b[200],
  "foreground-on-action": "#ffffff",
  "foreground-brand": b[700],
  "foreground-brand-strong": b[800],
  "foreground-link": b[700],
  "foreground-ai": b[700],
  "foreground-secondary-series": s[700],
  "foreground-success": g[700],
  "foreground-warning": a[700],
  "foreground-error": r[700],
  "foreground-info": b[700],
  // borders
  "border-subtle": n[200],
  "border-default": n[300],
  "border-strong": n[400],
  "border-focus": b[500],
  "border-brand": b[200],
  "border-secondary-series": s[200],
  "border-success": g[200],
  "border-warning": a[200],
  "border-error": r[200],
  "border-info": b[200],
  // accents: dots, glyph fills, chart marks
  "accent-brand": b[600],
  "accent-brand-vivid": b[500],
  "accent-secondary-series": s[500],
  "accent-success": g[500],
  "accent-warning": a[400],
  "accent-error": r[500],
  "accent-neutral": n[400],
  // sidebar: a pale brand wash in light
  // Sidebar ink is a blue-slate on the brand hue, so the labels belong to
  // the wash instead of sitting on it as grey.
  "foreground-nav-strong": b[900],
  "foreground-nav": oklch(0.41, 0.045, HUE),
  "foreground-nav-muted": oklch(0.53, 0.05, HUE),
  "foreground-nav-active": b[800],
  "accent-nav-rail": b[700],
};
const dark = {
  "background-page": D(0.165),
  "background-card": D(0.2),
  "background-elevated": D(0.225),
  "background-input": D(0.2),
  "background-sunken": D(0.235),
  "background-fill": D(0.25),
  "background-fill-strong": D(0.29),
  "background-header": D(0.185),
  "background-row-hover": D(0.235),
  "background-selected": D(0.28, 0.07, HUE),
  "background-disabled": D(0.24),
  "background-inverse": D(0.13, 0.05, HUE),
  "background-inverse-muted": D(0.19, 0.05, HUE),
  "background-brand": b[600],
  "background-brand-subtle": D(0.28, 0.07, HUE),
  "background-action": b[600],
  "background-action-hover": b[700],
  "background-action-pressed": b[800],
  "background-ai": D(0.28, 0.07, HUE),
  "background-secondary-series": D(0.28, 0.05, 240),
  "background-success": D(0.26, 0.045, 152),
  "background-warning": D(0.27, 0.05, 68),
  "background-error": D(0.26, 0.06, 27),
  "background-info": D(0.28, 0.07, HUE),
  "background-destructive": r[600],
  "background-destructive-hover": r[500],
  "background-nav-top": D(0.195, 0.04, HUE),
  "background-nav-bottom": D(0.195, 0.04, HUE),
  "background-nav-hover": D(0.235, 0.05, HUE),
  "background-nav-active": D(0.27, 0.07, HUE),
  "border-nav": D(0.27, 0.04, HUE),
  "foreground-primary": D(0.97, 0.008),
  "foreground-strong": D(0.9, 0.012),
  "foreground-secondary": D(0.82, 0.02),
  "foreground-tertiary": D(0.73, 0.025),
  "foreground-disabled": D(0.52, 0.02),
  "foreground-inverse": "#ffffff",
  "foreground-inverse-muted": b[200],
  "foreground-on-action": "#ffffff",
  "foreground-brand": b[300],
  "foreground-brand-strong": b[200],
  "foreground-link": b[300],
  "foreground-ai": b[300],
  "foreground-secondary-series": s[300],
  "foreground-success": g[300],
  "foreground-warning": a[300],
  "foreground-error": r[300],
  "foreground-info": b[300],
  "border-subtle": D(0.3),
  "border-default": D(0.37),
  "border-strong": D(0.48),
  "border-focus": b[400],
  "border-brand": D(0.42, 0.1, HUE),
  "border-secondary-series": D(0.42, 0.07, 240),
  "border-success": D(0.4, 0.07, 152),
  "border-warning": D(0.42, 0.08, 68),
  "border-error": D(0.42, 0.1, 27),
  "border-info": D(0.42, 0.1, HUE),
  "accent-brand": b[400],
  "accent-brand-vivid": b[400],
  "accent-secondary-series": s[400],
  "accent-success": g[400],
  "accent-warning": a[400],
  "accent-error": r[400],
  "accent-neutral": D(0.55, 0.02),
  "foreground-nav-strong": "#ffffff",
  "foreground-nav": D(0.84, 0.03, HUE),
  "foreground-nav-muted": D(0.72, 0.035, HUE),
  "foreground-nav-active": "#ffffff",
  "accent-nav-rail": b[300],
};

/* Every semantic token says where it is used (Design system building
   practices: lead with components, add pairing guidance). */
const DESCRIPTIONS = {
  "background-page": "The app canvas behind tables and pages.",
  "background-card": "Cards, dialogs, sheets, table rows and form panels.",
  "background-elevated": "Menus, popovers, the command palette: anything floating.",
  "background-input": "Text fields, selects and date fields.",
  "background-sunken": "Wells inside a card: segmented tracks, code chips, quiet panels.",
  "background-fill": "Neutral chips, avatars, secondary buttons and Missing-in-PR pills.",
  "background-fill-strong": "Pressed neutral controls, progress tracks, company initials.",
  "background-header": "Table header strip and section heads.",
  "background-row-hover": "A table row under the pointer.",
  "background-selected": "Selected rows (with a 2px brand edge) and checked menu items.",
  "background-disabled": "Disabled controls.",
  "background-inverse": "Toasts and dark hero blocks. Pair with foreground-inverse.",
  "background-inverse-muted": "Icon circles and chips on toasts.",
  "background-brand": "Brand-filled marks: the notification badge, solid tags.",
  "background-brand-subtle": "Brand wash: AI mark tile, info pills, active tab of a track.",
  "background-action": "Primary buttons. Pair with foreground-on-action.",
  "background-action-hover": "Primary button hover.",
  "background-action-pressed": "Primary button pressed.",
  "background-ai": "Behind a value the AI decided (the sparkle tile).",
  "background-secondary-series": "Second-blue wash: Manually matched, email channel, comparison series.",
  "background-success": "Approved / matched / synced pill ground.",
  "background-warning": "Needs review / pending / held pill ground.",
  "background-error": "Failed / missing / blocked pill ground and error banners.",
  "background-info": "Received / extracting / informational pill ground.",
  "background-destructive": "Delete buttons only. Red is reserved for errors and deletes.",
  "background-destructive-hover": "Delete button hover.",
  "background-nav-top": "Sidebar ground (top). Pale brand wash in light, tinted panel in dark.",
  "background-nav-bottom": "Sidebar ground (bottom); equal to top while the sidebar is flat.",
  "background-nav-hover": "A sidebar row under the pointer.",
  "background-nav-active": "The current page's row in the sidebar.",
  "border-nav": "The sidebar's right edge and its hairlines.",
  "foreground-primary": "Headings, party names, amounts: the main ink.",
  "foreground-strong": "Emphasised secondary text.",
  "foreground-secondary": "Body copy, table values, labels.",
  "foreground-tertiary": "Metadata, timestamps, placeholders, table headers.",
  "foreground-disabled": "Disabled labels.",
  "foreground-inverse": "Text on toasts and dark hero blocks.",
  "foreground-inverse-muted": "Secondary text on toasts.",
  "foreground-on-action": "Labels on primary and delete buttons.",
  "foreground-brand": "Links, tertiary buttons, section titles in forms, active tab.",
  "foreground-brand-strong": "Brand text on a brand wash; link hover.",
  "foreground-link": "Inline links.",
  "foreground-ai": "The sparkle glyph and AI reasons.",
  "foreground-secondary-series": "Text on the second-blue wash.",
  "foreground-success": "Approved / matched text.",
  "foreground-warning": "Needs review / pending text.",
  "foreground-error": "Error messages, failed states, ITC at risk.",
  "foreground-info": "Informational pill text.",
  "border-subtle": "Card edges, table rules, dividers.",
  "border-default": "Field borders, column rules, the ledger rule.",
  "border-strong": "Hovered fields, separators that must survive a TN panel.",
  "border-focus": "Focus edge on fields and the focus halo colour.",
  "border-brand": "Brand-wash edges: AI tile hover, selected cards.",
  "border-secondary-series": "Edges on second-blue washes.",
  "border-success": "Success pill and banner edges.",
  "border-warning": "Warning pill and banner edges.",
  "border-error": "Error pill and banner edges, invalid fields' halo.",
  "border-info": "Info pill edges.",
  "accent-brand": "Brand dots, chart's current series, switches on.",
  "accent-brand-vivid": "Received / extracting dots, progress fill.",
  "accent-secondary-series": "Second-blue dots and marks (Manually matched).",
  "accent-success": "Approved / synced dots, success icons.",
  "accent-warning": "Needs review / pending dots, warning icons.",
  "accent-error": "Failed / missing dots, error icons.",
  "accent-neutral": "Deleted / not started dots.",
  "foreground-nav-strong": "Sidebar headings and the company card name.",
  "foreground-nav-active": "The current page's label and icon.",
  "foreground-nav": "Sidebar labels.",
  "foreground-nav-muted": "Sidebar group headings.",
  "accent-nav-rail": "Sidebar active rail, tags and focus.",
};

/* ---------------------------------------------------------------- AA check */
const PAIRS = [
  ["foreground-primary", "background-card"], ["foreground-secondary", "background-card"],
  ["foreground-tertiary", "background-card"], ["foreground-tertiary", "background-header"],
  ["foreground-tertiary", "background-sunken"], ["foreground-brand", "background-card"],
  ["foreground-brand", "background-brand-subtle"], ["foreground-on-action", "background-action"],
  ["foreground-on-action", "background-action-hover"], ["foreground-on-action", "background-destructive"],
  ["foreground-success", "background-success"], ["foreground-warning", "background-warning"],
  ["foreground-error", "background-error"], ["foreground-error", "background-card"],
  ["foreground-secondary-series", "background-secondary-series"], ["foreground-secondary", "background-sunken"],
  ["foreground-inverse", "background-inverse"], ["foreground-nav", "background-nav-bottom"],
  ["foreground-nav-muted", "background-nav-bottom"], ["foreground-nav-strong", "background-nav-top"],
  ["foreground-nav-active", "background-nav-active"], ["foreground-nav", "background-nav-hover"],
];
const failures = [];
for (const [mode, t] of [["light", light], ["dark", dark]])
  for (const [fg, bg] of PAIRS) {
    const c = contrast(t[fg], t[bg]);
    if (c < 4.5) failures.push(`${mode}: ${fg} on ${bg} = ${c.toFixed(2)}`);
  }
if (failures.length) { console.error("AA failures:\n" + failures.join("\n")); process.exit(1); }

/* ------------------------------------------------------- app name mapping */
const v = (k) => `var(--${k})`;
function appTokens(t, mode) {
  const H = (k) => hsl(t[k]);
  const lines = {
    // shadcn (HSL triplets; components read hsl(var(--x)))
    background: H("background-page"), foreground: H("foreground-primary"),
    card: H("background-card"), "card-foreground": H("foreground-primary"),
    popover: H("background-elevated"), "popover-foreground": H("foreground-primary"), "popover-border": H("border-subtle"),
    primary: H("background-action"), "primary-hover": H("background-action-hover"), "primary-active": H("background-action-pressed"),
    "primary-foreground": H("foreground-on-action"),
    secondary: H("background-fill"), "secondary-foreground": H("foreground-secondary"),
    muted: H("background-fill"), "muted-foreground": H("foreground-tertiary"),
    accent: H("background-brand-subtle"), "accent-foreground": H("foreground-brand-strong"),
    border: H("border-subtle"), input: H("border-default"), "input-hover": H("border-strong"),
    ring: H("border-focus"), section: H("background-header"), "neutral-gray": H("border-subtle"), "panel-border": H("border-subtle"),
    destructive: H("background-error"), "destructive-foreground": H("foreground-error"), "danger-action": H("background-destructive"),
    green: H("background-success"), "green-foreground": H("foreground-success"), "green-border": H("border-success"),
    "warning-background": H("background-warning"), "warning-foreground": H("foreground-warning"), "warning-border": H("border-warning"),
    "status-success-icon": H("accent-success"), "status-warning-icon": H("accent-warning"), "status-error-icon": H("accent-error"),
    "badge-neutral": H("background-fill"), "badge-neutral-foreground": H("foreground-secondary"),
    "badge-information": H("background-info"), "badge-information-foreground": H("foreground-info"),
    "badge-positive": H("background-success"), "badge-positive-foreground": H("foreground-success"),
    "badge-notice": H("background-warning"), "badge-notice-foreground": H("foreground-warning"),
    "badge-negative": H("background-error"), "badge-negative-foreground": H("foreground-error"),
    surface: H("background-inverse"), "surface-muted": H("background-inverse-muted"),
    "surface-stroke": hsl(mode === "light" ? b[800] : D(0.3, 0.06, HUE)),
    "surface-foreground-muted": H("foreground-inverse-muted"), "surface-badge": H("background-brand"),
    "sidebar-background": H("background-nav-top"), "sidebar-foreground": H("foreground-nav"),
    "sidebar-primary": H("background-brand"), "sidebar-primary-foreground": H("foreground-on-action"),
    "sidebar-accent": H("background-brand-subtle"), "sidebar-accent-foreground": H("foreground-brand-strong"),
    "sidebar-border": H("border-subtle"), "sidebar-ring": H("border-focus"),
    "topnav-text": H("foreground-primary"), "topnav-avatar-text": H("foreground-on-action"),
    "media-dialog": H("background-inverse"), "brand-vivid-hsl": H("accent-brand-vivid"),
    "page-hsl": H("background-page"), "ink-hsl": H("foreground-primary"),
    // --pi-* raw names (read as var())
    "pi-page": v("background-page"), "pi-surface-panel": v("background-card"), "pi-sunken": v("background-sunken"),
    "pi-fill": v("background-fill"), "pi-fill-2": v("background-fill-strong"), "pi-row-hover": v("background-row-hover"),
    "pi-head-bg": v("background-header"),
    "pi-ink": v("foreground-primary"), "pi-ink-2": v("foreground-strong"), "pi-ink-3": v("foreground-tertiary"),
    "pi-body": v("foreground-secondary"), "pi-faint": v("foreground-tertiary"),
    "pi-line": v("border-subtle"), "pi-line-2": v("border-default"), "pi-line-strong": v("border-strong"),
    "pi-rule-ledger": v("border-default"),
    "pi-brand": v("foreground-brand"), "pi-brand-hover": v("foreground-brand-strong"),
    "pi-brand-active": mode === "light" ? b[900] : b[400],
    "pi-brand-tint": v("background-brand-subtle"), "pi-brand-border": v("border-brand"), "pi-brand-vivid": v("accent-brand-vivid"),
    "pi-btn-fill": v("background-action"), "pi-btn-fill-hover": v("background-action-hover"),
    "pi-btn-fill-active": v("background-action-pressed"), "pi-btn-primary-edge": "transparent",
    "pi-ai-ink": v("foreground-ai"),
    "pi-teal": v("accent-secondary-series"), "pi-teal-tint": v("background-secondary-series"),
    "pi-teal-strong": v("foreground-secondary-series"),
    "pi-success": v("foreground-success"), "pi-success-dot": v("accent-success"),
    "pi-success-bg": v("background-success"), "pi-success-line": v("border-success"),
    "pi-warning": v("foreground-warning"), "pi-warning-dot": v("accent-warning"),
    "pi-warning-bg": v("background-warning"), "pi-warning-line": v("border-warning"),
    "pi-danger": v("foreground-error"), "pi-danger-dot": v("accent-error"),
    "pi-danger-bg": v("background-error"), "pi-danger-line": v("border-error"),
    "pi-nav-top": v("background-nav-top"), "pi-nav-bottom": v("background-nav-bottom"),
    // effects
    "shadow-rgb": rgbTriplet(mode === "light" ? D(0.22, 0.05, HUE) : "#000000"),
    "overlay-scrim": mode === "light" ? `rgb(${rgbTriplet(D(0.2, 0.06, HUE))} / 36%)` : "rgb(0 0 0 / 60%)",
    "control-focus": `0 0 0 3px rgb(${rgbTriplet(mode === "light" ? b[500] : b[400])} / ${mode === "light" ? 22 : 35}%)`,
    "control-error-focus": `0 0 0 3px rgb(${rgbTriplet(r[500])} / ${mode === "light" ? 16 : 30}%)`,
    "source-dim": mode === "light" ? `rgb(${rgbTriplet(D(0.2, 0.06, HUE))} / 10%)` : "rgb(0 0 0 / 30%)",
    "shadow-contact": "0 1px 3px rgb(var(--shadow-rgb) / 6%)",
    "shadow-1": "0 2px 8px rgb(var(--shadow-rgb) / 9%)",
    "shadow-2": "0 8px 28px rgb(var(--shadow-rgb) / 14%), 0 2px 6px rgb(var(--shadow-rgb) / 6%)",
    "surface-shadow": "0 4px 20px rgb(var(--shadow-rgb) / 10%), 0 1px 3px rgb(var(--shadow-rgb) / 5%)",
    "pin-shade": "rgb(var(--shadow-rgb) / 10%)",
    "overlay-line": v("border-subtle"), "overlay-muted": v("background-header"),
    "table-rule": v("border-subtle"),
    "scrollbar-thumb": mode === "light" ? n[300] : D(0.42),
    "scrollbar-thumb-hover": mode === "light" ? n[400] : D(0.52),
    // engines share the bridge; offer state = "this field will create a master"
    "offer-wash": "transparent", "offer-stroke": v("border-strong"),
  };
  // Charts: an ordered categorical set inside the blue scheme, cycled.
  const series = mode === "light"
    ? [b[700], s[500], b[400], s[700], b[900], n[500], b[200], s[300]]
    : [b[300], s[400], b[500], s[200], b[100], D(0.6, 0.02), b[700], s[600]];
  for (let i = 1; i <= 48; i++) lines[`chart-${i}`] = hsl(series[(i - 1) % series.length]);
  lines["chart-magenta"] = hsl(series[1]);
  return lines;
}

/* -------------------------------------------------------------------- emit */
const block = (obj, indent = "  ") => Object.entries(obj).map(([k, val]) => `${indent}--${k}: ${val};`).join("\n");
const prims = {};
for (const [name, rmp] of Object.entries(P))
  for (const [step, hex] of Object.entries(rmp)) prims[`color-${name}-${step}`] = hex;
// Legacy --palette-* ramps (kickstart, bill splitter, pdf pages) follow the primitives.
const legacy = {};
for (const [from, to] of [["blue", "blue"], ["green", "green"], ["red", "red"], ["amber", "amber"], ["neutral", "neutral"]])
  for (const [step, hex] of Object.entries(P[to])) { legacy[`palette-${from}-${step}`] = hex; legacy[`palette-${from}-${step}-hsl`] = hsl(hex); }

const css = `/*
  Ink Navy — the prototype's colour foundation (9 Nov 2026).
  GENERATED by scripts/palette/ink-navy.mjs. Edit the generator, not this file.

  Loaded last (pages/_app.tsx), so it outranks globals.css (@layer base) and
  the Mercury theme's colour values. Mercury still owns shapes and spacing.

  Layers:
    --color-{hue}-{step}        primitives (OKLCH ramps)
    --background-* / --foreground-* / --border-* / --accent-*   semantic, light + dark
    shadcn names, --pi-*, badges, status, chart, palette, nav    the app's names, mapped

  Rules carried from Platform constraints: every reading pair meets AA (the
  generator refuses to write otherwise); red is only for errors; status is
  never colour alone (dots sit beside labels).
*/

:root {
${block(prims)}
${block(legacy)}
}

:root,
:root:not(.dark) {
${block(light)}
${block(appTokens(light, "light"))}
}

.dark,
:root.dark {
${block(dark)}
${block(appTokens(dark, "dark"))}
}

/* Sidebar: a pale brand wash in light, a tinted panel in dark. */
html:not(.dark) .workbench-sidebar,
html.dark .workbench-sidebar {
  --nav-ink: var(--foreground-nav-strong);
  --nav-body: var(--foreground-nav);
  --nav-faint: var(--foreground-nav-muted);
  --nav-line: var(--border-nav);
  --nav-hover: var(--background-nav-hover);
  --nav-active-bg: var(--background-nav-active);
  --nav-active-edge: transparent;
  --nav-active-ink: var(--foreground-nav-active);
  --nav-active-rail: var(--accent-nav-rail);
  --nav-tag-bg: var(--background-nav-active);
  --nav-tag-ink: var(--foreground-nav-active);
  background: linear-gradient(180deg, var(--background-nav-top), var(--background-nav-bottom));
  border-right: 1px solid var(--border-nav);
  color: var(--nav-body);
}
/* The logo follows the sidebar: dark ink on the pale wash, white in dark. */
html:not(.dark) .workbench-sidebar img {
  filter: brightness(0);
  opacity: 0.88;
}
html.dark .workbench-sidebar img {
  filter: brightness(0) invert(1);
  opacity: 1;
}
`;
const stage = `
/* The source document canvas is white in both themes: it reads the light
   values, whatever the theme. (Replaces the stray teal --primary that
   globals.css carried here.) */
.source-stage,
.dark .source-stage {
  background: #ffffff;
  color: ${n[900]};
  --foreground: ${hsl(n[900])};
  --secondary-foreground: ${hsl(n[700])};
  --muted-foreground: ${hsl(n[600])};
  --border: ${hsl(n[200])};
  --neutral-gray: ${hsl(n[200])};
  --background: 0 0% 100%;
  --accent: ${hsl(b[50])};
  --section: ${hsl(n[50])};
  --primary: ${hsl(b[700])};
  --pi-line: ${n[200]};
  --pi-ink: ${n[900]};
  --pi-body: ${n[700]};
  --pi-faint: ${n[600]};
  --pi-fill: ${n[100]};
  --pi-brand: ${b[700]};
  --pi-brand-tint: ${b[50]};
  --source-dim: rgb(${rgbTriplet(D(0.2, 0.06, HUE))} / 10%);
}

/* The AP/AR engines' drag grip is an SVG with its colour baked in. */
html .ap-sheet,
html .ar-sheet {
  --grip: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='16' viewBox='0 0 12 16'%3E%3Cg fill='%23${b[700].slice(1)}'%3E%3Ccircle cx='3.5' cy='3' r='1.35'/%3E%3Ccircle cx='8.5' cy='3' r='1.35'/%3E%3Ccircle cx='3.5' cy='8' r='1.35'/%3E%3Ccircle cx='8.5' cy='8' r='1.35'/%3E%3Ccircle cx='3.5' cy='13' r='1.35'/%3E%3Ccircle cx='8.5' cy='13' r='1.35'/%3E%3C/g%3E%3C/svg%3E");
}
`;
fs.writeFileSync(OUT, css + stage);
// The reference page (/dev/palette) reads this.
const JSON_OUT = path.resolve(here, "../../config/palette-tokens.json");
fs.writeFileSync(JSON_OUT, JSON.stringify({
  primitives: P,
  semantic: Object.keys(light).map((k) => ({
    name: k, light: light[k], dark: dark[k], description: DESCRIPTIONS[k] || "",
  })),
  pairs: PAIRS.map(([fg, bg]) => ({ fg, bg,
    light: +contrast(light[fg], light[bg]).toFixed(2), dark: +contrast(dark[fg], dark[bg]).toFixed(2) })),
}, null, 2));
console.log(`wrote ${path.relative(process.cwd(), OUT)} · ${Object.keys(prims).length} primitives · ${Object.keys(light).length} semantic tokens per mode`);
