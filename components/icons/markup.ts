import glyphs from "./markup.generated.json";

/** Trusted, build-generated SVG only. Never pass user content into this helper. */
export function iconMarkup(name: keyof typeof glyphs, size = 16) {
  return glyphs[name].replace(/(width|height)="16"/g, `$1="${size}"`);
}
