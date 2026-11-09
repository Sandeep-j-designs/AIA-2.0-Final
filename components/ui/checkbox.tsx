import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";
import { CheckIcon, Minus } from "@/components/icons";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  // The box is 16px; the ::before pads its hit area to 24px (WCAG 2.2
  // target size) without moving anything around it (27 Oct 2026).
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer relative h-4 w-4 shrink-0 rounded-xs border border-pi-line-2 bg-background shadow-contact before:absolute before:-inset-1 before:content-[''] hover:border-pi-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-pi-brand data-[state=checked]:bg-pi-brand data-[state=checked]:text-white data-[state=indeterminate]:border-pi-brand data-[state=indeterminate]:bg-pi-brand data-[state=indeterminate]:text-white",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      {/* Some, not all: a dash, so a header box never reads as "none"
          while rows below it are ticked (9 Nov 2026). */}
      {props.checked === "indeterminate" ? (
        <Minus className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
