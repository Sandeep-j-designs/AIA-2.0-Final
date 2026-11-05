import React from "react";
import { useRouter } from "next/router";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search } from "@/components/icons";
import { useStore } from "@/components/inbox/v2/store";
import FileIcon from "@/components/inbox/common/file-icon";

/**
 * ⌘K: one place to go anywhere and find any document (27 Oct 2026).
 *
 * The top-bar pill used to send "/" to the page, which only focused the
 * table's own search box, so the app had two search controls that did one
 * job and looked like two scopes. The pill now opens this: every page the
 * rail reaches, the company's documents by invoice no., party or file name,
 * and "Search this page" for the old behaviour.
 */
export type Destination = {
  id: string;
  label: string;
  group?: string;
  path: string;
};

/** Open work first: what is waiting on you, then duplicates, then records. */
const STATUS_RANK: Record<string, number> = {
  "Needs Review": 0,
  Duplicate: 1,
  Approved: 2,
};

const CommandPalette = ({
  open,
  onOpenChange,
  destinations,
  onSearchPage,
  onDestination,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinations: Destination[];
  onSearchPage: () => void;
  /**
   * How the rail itself navigates (the workspace maps nav ids to its own
   * views). Most rail paths are not pages of their own, so pushing the path
   * would miss; the palette goes the way a rail click does when it can.
   */
  onDestination?: (id: string) => void;
}) => {
  const router = useRouter();
  const state = useStore();
  const [query, setQuery] = React.useState("");
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const documents = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return state.items
      .filter(
        (x) =>
          x.company === state.company &&
          x.status in STATUS_RANK &&
          !x.priorVoucher &&
          [x.form.invoiceNo, x.form.party, x.file.name, x.form.voucherNo].some(
            (v) => v?.toLowerCase().includes(q)
          )
      )
      .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])
      .slice(0, 8);
  }, [query, state.items, state.company]);

  // Filtered here rather than by cmdk: documents match on fields their row
  // doesn't show, and one filter keeps Empty honest about both groups.
  const pages = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? destinations.filter((d) =>
          `${d.group ?? ""} ${d.label}`.toLowerCase().includes(q)
        )
      : destinations;
  }, [query, destinations]);
  const searchPage =
    !query.trim() || "search this page".includes(query.trim().toLowerCase());

  const go = (path: string) => {
    onOpenChange(false);
    void router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">Go to or find</DialogTitle>
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Go to a page, or find a document by invoice no. or party…"
          />
          <CommandList>
            <CommandEmpty>No page or document matches “{query}”.</CommandEmpty>
            {documents.length > 0 && (
              <CommandGroup heading="Documents">
                {documents.map((x) => (
                  <CommandItem
                    key={x.id}
                    value={`doc ${x.id}`}
                    onSelect={() => go(`/inbox?id=${encodeURIComponent(x.id)}`)}
                  >
                    <FileIcon ext="pdf" bare />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium text-pi-ink">
                        {x.form.invoiceNo || x.file.name}
                      </span>
                      <span className="text-pi-faint">
                        {" "}
                        · {x.form.party || "—"}
                      </span>
                    </span>
                    <span className="flex-none text-caption text-pi-faint">
                      {x.status}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {pages.length > 0 && (
              <CommandGroup heading="Go to">
                {pages.map((d) => (
                  <CommandItem
                    key={d.id}
                    value={`${d.group ?? ""} ${d.label}`}
                    onSelect={() => {
                      if (onDestination) {
                        onOpenChange(false);
                        onDestination(d.id);
                      } else go(d.path);
                    }}
                  >
                    <span className="flex-1 truncate">
                      {d.group && (
                        <span className="text-pi-faint">{d.group} / </span>
                      )}
                      {d.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchPage && (
              <CommandGroup heading="This page">
                <CommandItem
                  value="search this page filter table"
                  onSelect={() => {
                    onOpenChange(false);
                    // After the dialog has returned focus, or it steals it back.
                    window.setTimeout(onSearchPage, 0);
                  }}
                >
                  <Search />
                  <span className="flex-1">Search this page</span>
                  <CommandShortcut>/</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
