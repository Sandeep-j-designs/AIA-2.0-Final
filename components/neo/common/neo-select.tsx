import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type NeoOption = { value: string; label: React.ReactNode };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: NeoOption[];
  "aria-label": string;
  id?: string;
  className?: string;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Neo's dropdown: the app's Select, so the caret keeps its 12px inset like
 * every other field. The browser's own select drew its arrow against the
 * border (4 Nov 2026).
 */
const NeoSelect = ({
  value,
  onChange,
  options,
  id,
  className,
  defaultOpen,
  onOpenChange,
  ...rest
}: Props) => (
  <Select
    value={value}
    onValueChange={onChange}
    defaultOpen={defaultOpen}
    onOpenChange={onOpenChange}
  >
    <SelectTrigger
      id={id}
      aria-label={rest["aria-label"]}
      className={cn("gap-2 text-small text-pi-ink", className)}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value} className="text-small">
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default NeoSelect;
