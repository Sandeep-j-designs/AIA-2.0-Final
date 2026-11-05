/** Generate HTML-engine glyphs directly from React icons. No parallel drawings.
 * Run npm run icons:build after editing the family (also runs before dev/build).
 * --check verifies generated files without writing them.
 */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const check = process.argv.includes("--check");
const cache = new Map();
function load(file) {
  file =
    [".tsx", ".ts", "/index.tsx", "/index.ts"]
      .map((ext) => file + ext)
      .find(fs.existsSync) || file;
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const localRequire = Module.createRequire(file);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  new Function("require", "module", "exports", source)(
    (name) => {
      if (name.startsWith("."))
        return load(path.resolve(path.dirname(file), name));
      if (name.startsWith("@/")) return load(path.join(root, name.slice(2)));
      return localRequire(name);
    },
    mod,
    mod.exports
  );
  return mod.exports;
}
const icons = load(path.join(root, "components/icons/index"));
const mapping = {
  "i-chevron": "ChevronDown",
  "i-caret": "ChevronDown",
  "i-calendar": "Calendar",
  "i-checkbox": "Check",
  "i-upload": "Upload",
  "i-info": "Info",
  "i-sparkle": "Sparkle",
  "i-ai": "Sparkle",
  "i-plus": "Plus",
  "i-split": "Split",
  "i-percent": "Percent",
  "i-dots": "EllipsisVertical",
  "i-tick": "Check",
  "i-search": "Search",
  "i-zoom-out": "ZoomOut",
  "i-zoom-in": "ZoomIn",
  "i-expand": "Maximize",
  "i-collapse": "Minimize",
  "i-dash": "Minus",
  "i-file": "FileText",
  "i-pencil": "Pencil",
  "i-trash": "Trash2",
  "i-bd-chev": "ChevronDown",
  "i-bd-chev-up": "ChevronUp",
  "i-bd-chev-sm": "ChevronDown",
  "i-bd-plus": "Plus",
  "i-bd-trash": "Trash2",
  "i-close": "X",
  "i-gear": "Settings",
};
const names = [
  ...new Set([
    ...Object.values(mapping),
    "ChevronRight",
    "UserPlus",
    "LedgerPlus",
    "PackagePlus",
  ]),
];
const markup = Object.fromEntries(
  names.map((name) => [
    name,
    renderToStaticMarkup(React.createElement(icons[name], { size: 16 })),
  ])
);
function save(file, content) {
  const before = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (before === content) return;
  if (check)
    throw new Error(
      `Stale icon output: ${path.relative(root, file)}. Run npm run icons:build.`
    );
  fs.writeFileSync(file, content);
}
save(
  path.join(root, "components/icons/markup.generated.json"),
  JSON.stringify(markup, null, 2) + "\n"
);
for (const slug of ["ap", "ar"]) {
  const file = path.join(root, `public/${slug}/index.html`);
  const src = fs.readFileSync(file, "utf8");
  let next = src.replace(
    /<symbol\b[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/symbol>/g,
    (original, id) => {
      const name = mapping[id];
      if (!name) throw new Error(`Unmapped sheet icon: ${id}`);
      const glyph = markup[name]
        .replace(/^<svg[^>]*>/, "")
        .replace(/<\/svg>$/, "");
      return `<symbol id="${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph}</symbol>`;
    }
  );
  // CSS select carets also reuse the family, cropped to their wide slot.
  const caret = markup.ChevronDown.replace(
    'viewBox="0 0 24 24"',
    'viewBox="4 6 16 12"'
  ).replaceAll("currentColor", "#707070");
  const caretUrl = `url("data:image/svg+xml,${encodeURIComponent(caret)}")`;
  next = next.replace(
    /(--chevron:\s*|background-image:\s*)url\("data:image\/svg\+xml[^"\n]*"\)/g,
    (original, prefix) => prefix + caretUrl
  );
  // Legacy field icons used 10px artwork. Keep state ticks compact, but give
  // actionable form glyphs at least 14px without changing control hit areas.
  next = next.replace(
    /<svg\b[^>]*>\s*<use href="#(i-[^"]+)"\s*\/?>/g,
    (svg, id) => {
      if (id === "i-tick" || id === "i-checkbox") return svg;
      return svg.replace(
        /(width|height)="([\d.]+)"/g,
        (attr, dimension, size) =>
          Number(size) < 14 ? `${dimension}="14"` : attr
      );
    }
  );
  next = next.replace(
    ".ico svg{display:block}",
    ".ico svg{display:block;flex-shrink:0}"
  );
  save(file, next);
}
console.log(
  `Ledger: ${names.length} HTML glyphs synchronized with the React family.`
);
