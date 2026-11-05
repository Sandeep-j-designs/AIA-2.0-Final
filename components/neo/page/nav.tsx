import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Radio,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Ellipsis,
  NeoStar,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Settings,
  X,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NeoChat } from "@/types/pages/neo";
import { exportChat } from "./chat-title";
import { useNeo } from "@/hooks/pages/neo/use-neo";
import { cn } from "@/lib/utils";
import { DEMO_TODAY } from "@/utils/pages/inbox/ai-calculations";
import type { NeoPageId } from "./index";

type Props = {
  page: NeoPageId;
  onPage: (page: NeoPageId) => void;
  /** Folded to a strip of icons, for small screens. */
  folded?: boolean;
  /** Fold or unfold; absent in the phone sheet, which closes instead. */
  onToggle?: () => void;
};

const ICON_BTN =
  "relative grid h-9 w-9 place-items-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border disabled:opacity-50";

const ITEMS: { id: NeoPageId; label: string; icon: typeof NeoStar }[] = [
  { id: "chat", label: "Chat", icon: NeoStar },
  { id: "skills", label: "Skills", icon: Settings },
  { id: "agents", label: "Agents", icon: Radio },
  { id: "knowledge", label: "Company knowledge", icon: BookOpen },
];

const ROW =
  "flex h-9 w-full items-center gap-2 rounded-sm px-3 text-left text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border";

/**
 * Today, Yesterday, Previous 7 days, Older — as the chat apps file them,
 * counted from the prototype's one clock (DEMO_TODAY), the same day the
 * brief and the overdue days are counted from. A chat started now is later
 * than that, so it files under Today.
 */
const groupOf = (iso: string, now = DEMO_TODAY) => {
  const d = new Date(iso);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((start.getTime() - d.getTime()) / 86400000) + 1;
  if (d >= start) return "Today";
  if (days <= 1) return "Yesterday";
  if (days <= 7) return "Previous 7 days";
  return "Older";
};
const GROUPS = ["Starred", "Today", "Yesterday", "Previous 7 days", "Older"];

/**
 * Neo's own column, beside the app's icon rail: a new chat, Neo's four
 * places, and the conversations so far — starred first, then by day, with a
 * search over titles and messages. Each chat has a ⋯ menu on hover: Star,
 * Rename, Export, Delete. Opening one carries it on.
 */
const NeoNav = ({ page, onPage, folded, onToggle }: Props) => {
  const neo = useNeo();
  const busy = !!neo.busy;
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = neo.chats.filter(
      (c) =>
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text?.toLowerCase().includes(q))
    );
    const by = new Map<string, NeoChat[]>();
    hits
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .forEach((c) => {
        const g = c.starred ? "Starred" : groupOf(c.updatedAt);
        by.set(g, [...(by.get(g) || []), c]);
      });
    return GROUPS.filter((g) => by.has(g)).map((g) => [g, by.get(g)!] as const);
  }, [neo.chats, query]);

  // Folded (small screens, 20 Oct 2026): a 52px strip with the same
  // places as icons, recent chats behind one button, and unfold at the foot.
  if (folded)
    return (
      <nav
        aria-label="Neo"
        className="flex w-[52px] flex-none flex-col items-center gap-1 border-r border-pi-line bg-background py-2"
      >
        <button
          type="button"
          disabled={busy}
          title="New chat"
          aria-label="New chat"
          onClick={() => {
            neo.reset();
            onPage("chat");
          }}
          className={cn(
            ICON_BTN,
            "border border-pi-line-2 text-pi-ink shadow-pi-1 hover:bg-pi-fill"
          )}
        >
          <Plus className="h-4 w-4" />
        </button>
        <span className="my-1 h-px w-6 bg-pi-line" />
        {ITEMS.map((it) => {
          const active = page === it.id;
          return (
            <button
              key={it.id}
              type="button"
              title={it.label}
              aria-label={it.label}
              aria-current={active ? "page" : undefined}
              onClick={() => onPage(it.id)}
              className={cn(
                ICON_BTN,
                active
                  ? "bg-pi-fill text-pi-brand"
                  : "text-pi-body hover:bg-pi-fill hover:text-pi-ink"
              )}
            >
              <it.icon className="h-4 w-4" />
            </button>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Recent chats"
              aria-label="Recent chats"
              className={cn(
                ICON_BTN,
                "text-pi-body hover:bg-pi-fill hover:text-pi-ink"
              )}
            >
              <History className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-64">
            {neo.chats.length === 0 && (
              <p className="px-2 py-2 text-small text-pi-faint">No chats yet</p>
            )}
            {neo.chats.slice(0, 12).map((c) => (
              <DropdownMenuItem
                key={c.id}
                disabled={busy && c.id !== neo.chatId}
                onSelect={() => {
                  neo.openChat(c.id);
                  onPage("chat");
                }}
                className={cn(
                  "text-small",
                  c.id === neo.chatId && "font-medium"
                )}
              >
                <span className="truncate">{c.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {onToggle && (
          <button
            type="button"
            title="Show chats"
            aria-label="Show chats"
            onClick={onToggle}
            className={cn(
              ICON_BTN,
              "mt-auto text-pi-body hover:bg-pi-fill hover:text-pi-ink"
            )}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </nav>
    );

  return (
    <nav
      aria-label="Neo"
      className="flex w-60 flex-none flex-col border-r border-pi-line bg-background"
    >
      {/* Skills has one door, its row below (4 Nov 2026: a gear here led to
          the same page). */}
      <div className="flex h-11 items-center px-4 pt-3">
        <span className="text-body font-semibold text-pi-ink">Neo</span>
      </div>
      <div className="flex flex-col gap-3 px-3 pb-2 pt-2">
        <button
          type="button"
          disabled={busy}
          title={busy ? "Neo is working on the current chat" : undefined}
          onClick={() => {
            neo.reset();
            onPage("chat");
          }}
          className="flex h-9 items-center gap-2 rounded-sm border border-pi-line-2 bg-background px-3 text-body font-medium text-pi-ink shadow-pi-1 transition-colors hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
        <ul className="flex flex-col gap-0.5">
          {ITEMS.map((it) => {
            const active = page === it.id;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onPage(it.id)}
                  className={cn(
                    ROW,
                    active
                      ? "bg-pi-fill font-semibold text-pi-ink"
                      : "text-pi-ink-2 hover:bg-pi-fill"
                  )}
                >
                  <it.icon
                    className={cn(
                      "h-4 w-4 flex-none",
                      active ? "text-pi-brand" : "text-pi-body"
                    )}
                  />
                  <span className="flex-1 truncate">{it.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-3 pb-1 pt-3">
        <label className="flex h-8 items-center gap-2 rounded-sm border border-pi-line bg-background px-3 text-pi-body focus-within:border-primary">
          <Search className="h-3.5 w-3.5 flex-none" />
          <span className="sr-only">Search chats</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Search chats"
            className="min-w-0 flex-1 bg-transparent text-small text-pi-ink placeholder:text-pi-faint focus-visible:outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="grid h-4 w-4 place-items-center rounded-xs hover:text-pi-ink"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {grouped.length === 0 && (
          <p className="px-3 py-3 text-small text-pi-faint">
            {query ? "No chats match" : "No chats yet"}
          </p>
        )}
        {grouped.map(([group, list]) => (
          <section key={group} className="mt-3">
            <h3 className="px-3 pb-1 text-caption font-semibold text-pi-faint">
              {group}
            </h3>
            <ul>
              {list.map((c) => (
                <ChatRow
                  key={c.id}
                  chat={c}
                  current={page === "chat" && c.id === neo.chatId}
                  disabled={busy && c.id !== neo.chatId}
                  renaming={renaming === c.id}
                  onRenaming={(on) => setRenaming(on ? c.id : null)}
                  onOpen={() => {
                    neo.openChat(c.id);
                    onPage("chat");
                  }}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {onToggle && (
        <div className="flex-none border-t border-pi-line px-3 py-2">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              ROW,
              "h-8 text-small text-pi-body hover:bg-pi-fill hover:text-pi-ink"
            )}
          >
            <PanelLeftClose className="h-4 w-4 flex-none" />
            Hide chats
          </button>
        </div>
      )}
    </nav>
  );
};

export default NeoNav;

type RowProps = {
  chat: NeoChat;
  current: boolean;
  disabled: boolean;
  renaming: boolean;
  onRenaming: (on: boolean) => void;
  onOpen: () => void;
};

/** One chat in the list, with its ⋯ menu and in-place rename. */
const ChatRow = ({
  chat: c,
  current,
  disabled,
  renaming,
  onRenaming,
  onOpen,
}: RowProps) => {
  const neo = useNeo();
  const [draft, setDraft] = useState(c.title);
  if (renaming)
    return (
      <li>
        <input
          autoFocus
          aria-label="Chat name"
          value={draft}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            neo.renameChat(c.id, draft);
            onRenaming(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(c.title);
              onRenaming(false);
            }
          }}
          className="h-9 w-full rounded-sm border border-primary bg-background px-3 text-body text-pi-ink focus-visible:outline-none"
        />
      </li>
    );
  return (
    <li className="group/chat relative">
      <button
        type="button"
        disabled={disabled}
        title={c.title}
        aria-current={current ? "true" : undefined}
        onClick={onOpen}
        className={cn(
          ROW,
          "pr-8 disabled:opacity-50",
          current
            ? "bg-pi-fill font-medium text-pi-ink"
            : "text-pi-ink-2 hover:bg-pi-fill"
        )}
      >
        <span
          key={c.title}
          className="truncate duration-500 animate-in fade-in-0"
        >
          {c.title}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Options for ${c.title}`}
            className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-sm text-pi-body opacity-0 transition-opacity hover:bg-background hover:text-pi-ink focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border group-hover/chat:opacity-100 data-[state=open]:opacity-100"
          >
            <Ellipsis className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onSelect={() => neo.toggleStar(c.id)}>
            <Star className={cn("mr-2 h-4 w-4", c.starred && "fill-current")} />
            {c.starred ? "Unstar" : "Star"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setDraft(c.title);
              window.setTimeout(() => onRenaming(true), 0);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              exportChat(
                c.id === neo.chatId ? { ...c, messages: neo.messages } : c
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export as Markdown
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!!neo.busy && c.id === neo.chatId}
            onSelect={() => neo.deleteChat(c.id)}
            className="text-status-error focus:text-status-error"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
};
