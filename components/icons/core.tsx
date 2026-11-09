import * as React from "react";

import { cn } from "@/lib/utils";

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  color?: string;
};
export type IconComponent = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;
/** Alias kept so `import type { LucideIcon }` call sites keep compiling. */
export type LucideIcon = IconComponent;
export type LucideProps = IconProps;

const kebab = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export function make(
  name: string,
  glyph: React.ReactNode,
  grid = 24
): IconComponent {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    (
      {
        size = 20,
        strokeWidth = grid * 0.075,
        color = "currentColor",
        absoluteStrokeWidth = false,
        className,
        ...rest
      },
      ref
    ) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={`0 0 ${grid} ${grid}`}
        fill="none"
        color={color}
        stroke={color}
        strokeWidth={
          absoluteStrokeWidth && Number(size) > 0
            ? (Number(strokeWidth) * grid) / Number(size)
            : strokeWidth
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        role={rest["aria-label"] || rest["aria-labelledby"] ? "img" : undefined}
        aria-hidden={
          rest["aria-label"] || rest["aria-labelledby"] ? undefined : true
        }
        focusable="false"
        className={cn("aia-icon", `aia-icon-${kebab(name)}`, className)}
        {...rest}
      >
        {glyph}
      </svg>
    )
  );
  Icon.displayName = name;
  return Icon;
}
