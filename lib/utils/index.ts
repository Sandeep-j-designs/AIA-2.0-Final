import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    // The role spacing names from tailwind.config.ts, so `cn("px-4", "px-page")`
    // keeps the later one.
    theme: {
      spacing: [
        "inline",
        "stack",
        "field",
        "card",
        "card-lg",
        "section",
        "section-gap",
        "page",
      ],
    },
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "lead",
            "body",
            "small",
            "caption",
            "overline",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
