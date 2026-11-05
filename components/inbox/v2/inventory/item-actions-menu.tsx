import React from "react";
import { Eye, MoreVertical, Pencil, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isSyncInProgress } from "@/hooks/pages/inbox/use-inventory";

type Props = {
  name: string;
  syncStatus: string;
  /** What clicking the row does: open the item. */
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  notify: (message: string, kind?: "warning") => void;
};

/**
 * production's components/inventory-masters/item-actions-menu.tsx: Edit and
 * Delete, each refusing with a warning while the item's sync state forbids it.
 *
 * Figma (Inventory Masters 603:4887, 28 Oct 2026): a vertical kebab, and
 * View Inventory first — the row's own click, offered where people look for
 * it. Clicks and keys stay inside the menu, so choosing an item never also
 * reaches the row behind it (the content is portalled, but React still
 * bubbles through the portal to the row).
 */
const ItemActionsMenu = ({
  name,
  syncStatus,
  onView,
  onEdit,
  onDelete,
  notify,
}: Props) => {
  const isSynced = syncStatus === "synced";
  const isInProgress = isSyncInProgress(syncStatus);

  const handleEdit = () => {
    if (isInProgress) {
      notify("Cannot edit an item while sync is in progress", "warning");
      return;
    }
    onEdit();
  };

  const handleDelete = () => {
    if (isSynced || isInProgress) {
      notify(
        isSynced
          ? "Cannot delete a synced item"
          : "Cannot delete an item while sync is in progress",
        "warning"
      );
      return;
    }
    onDelete();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${name}`}
          className="size-7 text-pi-faint hover:text-pi-ink"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[176px]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onView}>
            <Eye className="mr-2 h-4 w-4" />
            View Inventory
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleDelete}
            className="text-pi-danger focus:bg-pi-danger-bg focus:text-pi-danger"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ItemActionsMenu;
