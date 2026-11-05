#!/usr/bin/env node
/*
  Type hygiene check (27 Oct 2026). Every size in the prototype is one of the
  nine roles in styles/globals.css ("Typography"). This fails on anything
  else:
    - Tailwind: text-[Npx], Tailwind's own text-xs…9xl, the retired
      text-title-* / text-label-* / text-body-N / text-caption-N / text-h4-6
    - weights outside 400/500/600 (700 only next to the display role)
    - inline style fontSize
    - CSS font-size that isn't var(--type-*), inherit, an em/% or 0
  A line that says `type-exempt` is skipped (decorative miniatures only).
  The paper files are skipped whole: they draw the source document, where
  small print is content, not UI (see CLAUDE.md, "Applied 4 Oct 2026").
*/
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIRS = ["components", "pages", "config", "lib", "styles", "hooks", "utils"];

const TS_RULES = [
  [/(?<![\w-])text-\[\d+(?:\.\d+)?(?:px|rem)\]/, "arbitrary font size — use a role"],
  [
    /(?<![\w-])text-(?:xs|sm|base|lg|[2-9]?xl|title-[123]|h[4-6]|label-[123]|body-[1-4]|caption-[12])(?![\w-])/,
    "retired type class — use display/h1/h2/h3/lead/body/small/caption/overline",
  ],
  [/(?<![\w-])font-(?:thin|extralight|light|extrabold|black)(?![\w-])/, "weight off the scale (400/500/600)"],
  [/(?<![\w-])font-bold(?![\w-])(?![^\n]*text-display)/, "700 is for the display role only"],
  [/fontSize:\s*["'\d]/, "inline fontSize — use a role class"],
];
const CSS_RULES = [
  [
    /font-size:\s*(?!\s|var\(--type-|inherit|0\s*;|[\d.]+(?:em|%))[^;]+;/,
    "font-size off the scale — use var(--type-<role>)",
  ],
  [/font-weight:\s*(?:[1-3]00|[89]00)\b/, "weight off the scale (400/500/600)"],
];

const PAPER = new Set([
  "components/inbox/v2/preview.module.css",
  "components/inbox/v2/document-loader.module.css",
  "components/inbox/v2/upload-animation.module.css",
]);

const problems = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") walk(full);
      continue;
    }
    const isCss = entry.name.endsWith(".css");
    const isTs = /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts");
    if (!isCss && !isTs) continue;
    if (PAPER.has(path.relative(ROOT, full))) continue;
    const rules = isCss ? CSS_RULES : TS_RULES;
    fs.readFileSync(full, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (line.includes("type-exempt")) return;
        for (const [re, why] of rules) {
          const m = line.match(re);
          if (m)
            problems.push(
              `${path.relative(ROOT, full)}:${i + 1}  ${m[0].trim()}  — ${why}`
            );
        }
      });
  }
};
for (const d of DIRS) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) walk(full);
}

// 700 in CSS only beside the display role, checked per rule block.
for (const d of ["styles", "components"]) {
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(full);
      else if (entry.name.endsWith(".css") && !PAPER.has(path.relative(ROOT, full))) {
        const src = fs.readFileSync(full, "utf8");
        for (const m of src.matchAll(/\{[^{}]*font-weight:\s*700[^{}]*\}/g))
          if (!m[0].includes("--type-display") && !m[0].includes("type-exempt"))
            problems.push(
              `${path.relative(ROOT, full)}:${src.slice(0, m.index).split("\n").length}  font-weight: 700  — 700 is for the display role only`
            );
      }
    }
  };
  scan(path.join(ROOT, d));
}

if (problems.length) {
  console.error(`Type check: ${problems.length} problem(s)\n`);
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("Type check: every size is on the nine-role scale.");
