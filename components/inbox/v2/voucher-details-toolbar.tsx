import React from "react";
import {
  ChevronUp,
  ChevronDown,
  Maximize,
  Minimize,
  Pencil,
  X,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import s from "./record-panel.module.css";

export const VoucherToolButton = ({
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    className={cn(s.tool, danger && s.danger)}
  >
    {children}
  </button>
);

/** Shared details header for purchase, sales, journal and banking vouchers. */
export default function VoucherDetailsToolbar({
  position,
  total,
  onNavigate,
  onEdit,
  canEdit,
  expanded,
  onExpand,
  onClose,
  children,
}: {
  position: number;
  total: number;
  onNavigate: (direction: -1 | 1) => void;
  onEdit: () => void;
  canEdit: boolean;
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <header className={s.toolbar} aria-label="Voucher details toolbar">
      <div className={s.group}>
        <VoucherToolButton
          label="Previous voucher"
          disabled={position <= 0}
          onClick={() => onNavigate(-1)}
        >
          <ChevronUp size={16} aria-hidden />
        </VoucherToolButton>
        <span
          className="whitespace-nowrap text-caption tabular-nums text-pi-body"
          aria-live="polite"
        >
          {position < 0 ? 0 : position + 1} of {total}
        </span>
        <VoucherToolButton
          label="Next voucher"
          disabled={position < 0 || position >= total - 1}
          onClick={() => onNavigate(1)}
        >
          <ChevronDown size={16} aria-hidden />
        </VoucherToolButton>
        <span className={s.divider} aria-hidden />
        <VoucherToolButton
          label="Edit entry"
          disabled={!canEdit}
          onClick={onEdit}
        >
          <Pencil size={15} aria-hidden />
        </VoucherToolButton>
        {children}
      </div>
      <div className={cn(s.group, "ml-auto")}>
        <VoucherToolButton
          label={expanded ? "Show the table" : "Expand to full width"}
          onClick={onExpand}
        >
          {expanded ? (
            <Minimize size={15} aria-hidden />
          ) : (
            <Maximize size={15} aria-hidden />
          )}
        </VoucherToolButton>
        <VoucherToolButton label="Close" onClick={onClose}>
          <X size={16} aria-hidden />
        </VoucherToolButton>
      </div>
    </header>
  );
}
