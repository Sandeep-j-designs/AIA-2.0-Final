import * as React from "react";
import { cn } from "@/lib/utils";
import { useLateError } from "@/hooks/common/use-late-error";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error: rawError, ...props }, ref) => {
    const autoComplete = props.autoComplete ?? "off";
    // A new error waits for blur; see useLateError. Callers mark the box red
    // with `error`, `aria-invalid` or `data-invalid`, so all three wait.
    const flagged =
      !!rawError ||
      props["aria-invalid"] === true ||
      props["aria-invalid"] === "true" ||
      (props as Record<string, unknown>)["data-invalid"] === true ||
      (props as Record<string, unknown>)["data-invalid"] === "true";
    const late = useLateError(rawError || flagged);
    const error = late.error ? rawError : undefined;
    const held = late.holding
      ? { "aria-invalid": false, "data-invalid": false }
      : {};

    return (
      <div className="flex flex-col w-full">
        <input
          autoComplete={autoComplete}
          data-slot="input"
          type={type}
          className={cn(
            "flex h-control w-full rounded-sm border border-pi-line-2 bg-background p-[var(--pad-control)] text-small text-foreground transition-colors file:border-0 file:bg-transparent file:text-body file:font-medium placeholder:text-pi-faint focus-visible:outline-none focus-visible:border-pi-brand focus-visible:shadow-[0_0_0_3px_rgba(67,88,191,0.2)] disabled:cursor-not-allowed disabled:opacity-60",
            "data-[invalid=true]:border-destructive-foreground data-[invalid=true]:focus:border-destructive-foreground data-[invalid=true]:hover:border-destructive-foreground",
            error
              ? "border-pi-danger focus:border-pi-danger hover:border-pi-danger"
              : "",
            className
          )}
          ref={ref}
          {...props}
          {...held}
          onFocus={(e) => {
            late.focusProps.onFocus();
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            late.focusProps.onBlur(e);
            props.onBlur?.(e);
          }}
        />
        {error ? (
          // One 12px line under the box, on its left edge (the forms' error
          // rule, 7 Oct 2026); it used to collapse to a zero line-height.
          <p role="alert" className="mt-2 text-left text-caption leading-4 text-pi-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
