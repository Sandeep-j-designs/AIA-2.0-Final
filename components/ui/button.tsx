import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader } from "@/components/icons";

import { cn } from "@/lib/utils/index";

const buttonVariants = cva(
  "ui-button relative inline-flex items-center justify-center gap-1 box-border whitespace-nowrap rounded-sm border border-transparent text-small font-medium leading-none tracking-normal transition-[background-color,color,opacity,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Subtle raised surfaces inspired by Supabase, using the navy theme.
        // Preserve existing default/primary semantics for current callers.
        default:
          "button-primary-surface border-pi-btn-fill-active bg-pi-btn-fill text-white hover:bg-pi-btn-fill-hover data-[state=open]:bg-pi-btn-fill-hover active:bg-pi-btn-fill-active",
        primary:
          "button-primary-surface border-pi-btn-fill-active bg-pi-btn-fill text-white hover:bg-pi-btn-fill-hover data-[state=open]:bg-pi-btn-fill-hover active:bg-pi-btn-fill-active",
        destructive:
          "button-primary-surface border-pi-danger bg-danger-action text-white hover:opacity-90",
        /*
          The hierarchy (27 Oct 2026), after a reference screen the user
          shared: three steps of brand, then neutral.
          - primary: solid brand. One per surface; completes the step.
          - secondary: white, brand outline and label. Moves work forward
            without being the step (Sync, Create, Retry).
          - tertiary: brand label, no box. Low-emphasis actions (Add line,
            View all, a brand ⋯).
          - outline: neutral. Cancel, Back and view tools (Columns, Export);
            never recoloured.
          - ghost: neutral, no box. Toolbars, pagers, in-row icons.
          `secondary` used to be the same neutral button as `outline`, so a
          screen had one blue button and everything else grey.
        */
        outline:
          "button-neutral-surface border-pi-line-2 bg-background text-foreground hover:bg-pi-fill hover:border-pi-line-strong data-[state=open]:bg-pi-fill active:bg-pi-fill-2",
        secondary:
          "border-pi-brand-border bg-background text-pi-brand hover:border-pi-brand hover:bg-pi-brand-tint data-[state=open]:border-pi-brand data-[state=open]:bg-pi-brand-tint active:bg-pi-brand-tint",
        tertiary:
          "bg-transparent text-pi-brand shadow-none hover:bg-pi-brand-tint data-[state=open]:bg-pi-brand-tint",
        ghost:
          "bg-transparent text-pi-body shadow-none hover:bg-pi-fill hover:text-foreground data-[state=open]:bg-pi-fill",
        link: "rounded-none border-0 bg-transparent text-primary underline-offset-[3px] hover:underline",
        "link-secondary":
          "rounded-none border-0 bg-transparent text-muted-foreground underline-offset-[3px] hover:underline",
      },
      isDestructive: { true: "", false: "" },
      size: {
        default: "h-control px-3",
        sm: "h-control-sm px-3 text-caption",
        lg: "h-control-lg px-4",
        icon: "h-control w-control p-0",
        "icon-sm": "h-control w-control p-0 text-caption",
        "icon-xs": "h-6 w-6 p-0",
        "icon-xss": "h-5 w-5 p-0",
      },
    },
    compoundVariants: [
      {
        isDestructive: true,
        variant: ["default", "primary"],
        className:
          "button-primary-surface border-pi-danger bg-danger-action text-white hover:opacity-90",
      },
      {
        isDestructive: true,
        variant: "secondary",
        className:
          "border-pi-danger-line bg-destructive text-destructive-foreground hover:border-pi-danger",
      },
      {
        isDestructive: true,
        variant: "outline",
        className:
          "border-pi-danger-line text-destructive-foreground hover:bg-destructive",
      },
      {
        isDestructive: true,
        variant: ["ghost", "tertiary"],
        className: "text-destructive-foreground hover:bg-destructive",
      },
      {
        isDestructive: true,
        variant: ["link", "link-secondary"],
        className: "text-destructive-foreground",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loadingIndicator?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      isDestructive,
      leadingIcon,
      trailingIcon,
      size,
      children,
      loadingIndicator,
      loading = false,
      asChild = false,
      disabled = false,
      onClickCapture,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        data-variant={variant ?? "default"}
        data-size={size ?? "default"}
        data-destructive={
          isDestructive || variant === "destructive" || undefined
        }
        className={cn(
          buttonVariants({ variant, size, isDestructive, className })
        )}
        ref={ref}
        disabled={loading || disabled}
        aria-busy={loading}
        {...props}
        aria-disabled={loading || disabled || undefined}
        onClickCapture={(event) => {
          if (loading || disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClickCapture?.(event);
        }}
      >
        {loading
          ? loadingIndicator || (
              <Loader aria-hidden="true" className="animate-spin" />
            )
          : leadingIcon}
        <Slottable>{children}</Slottable>
        {trailingIcon}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
