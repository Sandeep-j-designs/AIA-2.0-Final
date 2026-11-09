import * as React from "react";
import { cn } from "@/lib/utils";
import { useLateError } from "@/hooks/common/use-late-error";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  // A new error waits for blur, as on Input (useLateError).
  const late = useLateError(
    props["aria-invalid"] === true || props["aria-invalid"] === "true"
  );
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[60px] w-full rounded-sm border border-pi-line-2 bg-background p-[var(--pad-control)] text-small placeholder:text-pi-faint focus-visible:outline-none focus-visible:border-pi-brand focus-visible:shadow-[var(--control-focus)] disabled:cursor-not-allowed disabled:opacity-50 md:text-body",
        className
      )}
      ref={ref}
      {...props}
      {...(late.holding ? { "aria-invalid": false } : {})}
      onFocus={(e) => {
        late.focusProps.onFocus();
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        late.focusProps.onBlur(e);
        props.onBlur?.(e);
      }}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
