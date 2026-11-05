import React from "react";
import { cn } from "@/lib/utils";
import { TypographyVariant, TypographyWeight } from "@/types/components";

export type TypographyProps = {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  className?: string;
  children: React.ReactNode;
  id?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
};

// Variants resolve to the nine type roles (styles/globals.css). The older
// names are kept so existing call-sites still compile, each on its role.
const variantClasses = {
  h1: "scroll-m-20 text-h1",
  h2: "scroll-m-20 text-h2",
  h3: "scroll-m-20 text-h3",
  h4: "scroll-m-20 text-lead font-semibold",
  h5: "scroll-m-20 text-lead font-semibold",
  h6: "scroll-m-20 text-lead font-semibold",
  p: "text-body",
  small: "text-small",
  xs: "text-caption",
  "title-1": "text-display",
  "title-2": "text-display",
  "title-3": "text-display",
  "label-1": "text-body font-medium",
  "label-2": "text-small font-medium",
  "label-3": "text-caption font-medium",
  "body-1": "text-lead",
  "body-2": "text-body",
  "body-3": "text-body",
  "body-4": "text-caption",
  "caption-1": "text-caption",
  "caption-2": "text-caption",
  blockquote: "mt-6 border-l-2 pl-6 text-body italic",
  code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-body",
};

const weightClasses = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-semibold", // 700 is reserved for display
};

const Typography: React.FC<TypographyProps> = ({
  variant = "p",
  weight = "normal",
  className,
  children,
  id,
  style,
  as,
  ...props
}) => {
  const internalVariant = variant === "sm" ? "small" : variant;
  const Component =
    as ??
    ((internalVariant === "xs" ||
    internalVariant.startsWith("label-") ||
    internalVariant.startsWith("caption-")
      ? "span"
      : internalVariant.startsWith("body-") ||
          internalVariant.startsWith("title-")
        ? "p"
        : internalVariant) as keyof JSX.IntrinsicElements);

  return (
    <Component
      id={id}
      className={cn(
        variantClasses[internalVariant],
        weightClasses[weight],
        "font-open-sans",
        className
      )}
      style={{
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Typography;
