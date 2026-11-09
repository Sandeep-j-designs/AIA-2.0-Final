import iconStyles from "./navigation-icons.module.css";
import NeoPresence from "@/components/neo/presence";
import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import {
  Accounting,
  Inventory,
  ChevronRight,
  Receivables,
  DocumentInbox,
  Banking,
  Overview,
  PanelLeftClose,
  PanelLeftOpen,
  Compliance,
  Reconcile,
  NeoStar,
  Payables,
  AccountTree,
  TaxReconciliation,
} from "@/components/icons";
import AppTopBar, { type Crumb } from "@/components/top-bar-layout";
import { basePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { useBanking } from "@/hooks/pages/inbox/use-banking";
import type { UserCompany } from "@/types/pages/organisation";

/**
 * PROTOTYPE STUB: same path and Props contract as
 * components/sidebar-layout/index.tsx in aiaccountant-app. Deleted at handoff.
 *
 * Precision Indigo workbench shell, after ai-accountant-redesign
 * (src/components/Sidebar.tsx + src/workbench.css):
 * - a solid navy rail (Cobalt theme, 27 Oct 2026), 216px expanded and 64px
 *   collapsed, its two hairlines running edge to edge;
 * - 36px rows on one icon and label line; the active row is a soft fill with
 *   a rail on the sidebar's edge, and an active child a fill with a rail on
 *   the group's guide line;
 * - tags and counts as tinted pills; on the icon rail a count becomes a dot;
 * - the collapse toggle pinned to the foot;
 * - a white 56px top bar (AppTopBar) over a slate content canvas.
 */

type Props = {
  children: ReactNode;
  defaultSidebarState?: boolean;
  contentClassName?: string;
  crumbs?: Crumb[];
  /** Prototype-only: the Needs Review count on the Inbox entry. */
  inboxCount?: number;
  /** Prototype-only: PRD §4.1's launch tag on the Inbox entry. */
  inboxNew?: boolean;
  onGuide?: () => void;
  /** Prototype-only: every route is /inbox, so the caller resolves nav ids. */
  onNavSelect?: (id: string) => void;
  activeNavId?: string;
  companies?: UserCompany[];
  companyId?: string;
  onCompanyChange?: (id: string) => void;
  onCompanyCreate?: (name: string) => string;
  onCompanyRename?: (id: string, name: string) => void;
  companyAction?: ReactNode;
};

type Leaf = { id: string; label: string; path: string; tag?: string };
type NavNode =
  | { kind: "item"; id: string; label: string; path: string; icon: ReactNode }
  | {
      kind: "group";
      id: string;
      label: string;
      icon: ReactNode;
      children: Leaf[];
    };

/*
  Work, then books (5 Nov 2026). The rail was one list of eleven rows at one
  weight, daily work mixed in with masters, three of its groups holding a
  single page. Now the rows sit under who uses them when: the queues you clear
  every day (with what is waiting in them), the books, then filing and ERP.
  Under a heading every group was an extra click to one or two pages, so
  every page is a row of its own. Groups still render if one is added.
*/
type NavSection = { heading?: string; nodes: NavNode[] };
const SECTIONS: NavSection[] = [
  {
    nodes: [
      {
        kind: "item",
        id: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        icon: <Overview />,
      },
    ],
  },
  {
    heading: "Work",
    nodes: [
      {
        kind: "item",
        id: "inbox",
        label: "Inbox",
        path: "/inbox",
        icon: <DocumentInbox />,
      },
      {
        // Neo has its own Chat and Skills navigation.
        kind: "item",
        id: "neo",
        label: "Neo",
        path: "/inbox?module=NEO",
        icon: <NeoStar />,
      },
      {
        kind: "item",
        id: "banking",
        label: "Banking",
        path: "/bank",
        icon: <Banking />,
      },
    ],
  },
  {
    heading: "Books",
    nodes: [
      {
        kind: "item",
        id: "purchases",
        label: "Purchases",
        path: "/accounts-payable",
        icon: <Payables />,
      },
      {
        kind: "item",
        id: "sales",
        label: "Sales",
        path: "/accounts-receivable",
        icon: <Receivables />,
      },
      {
        kind: "item",
        id: "journal-vouchers",
        label: "Journal vouchers",
        path: "/journals",
        icon: <Accounting />,
      },
      {
        kind: "item",
        id: "chart-of-accounts",
        label: "Chart of accounts",
        path: "/coa",
        icon: <AccountTree />,
      },
      {
        kind: "item",
        id: "inventory",
        label: "Stock items",
        path: "/inventory-masters",
        icon: <Inventory />,
      },
    ],
  },
  {
    heading: "Compliance",
    nodes: [
      {
        kind: "item",
        id: "gst",
        label: "GST reconciliation",
        path: "/gst-reconciliation",
        icon: <TaxReconciliation />,
      },
      {
        kind: "item",
        id: "checks",
        label: "Compliance checks",
        path: "/inbox?module=CHECKS",
        icon: <Compliance />,
      },
      {
        kind: "item",
        id: "configuration",
        label: "Sync management",
        path: "/configuration",
        icon: <Reconcile />,
      },
    ],
  },
];
const NAV: NavNode[] = SECTIONS.flatMap((section) => section.nodes);

/** Every page the rail reaches, flat, for the command palette's Go to. */
export const NAV_DESTINATIONS = NAV.flatMap((node) =>
  node.kind === "item"
    ? [{ id: node.id, label: node.label, path: node.path }]
    : node.children.map((child) => ({
        id: child.id,
        label: child.label,
        group: node.label,
        path: child.path,
      }))
) as { id: string; label: string; group?: string; path: string }[];

/** Breadcrumb trail shown in the top bar for each nav id. */
export const NAV_TRAIL: Record<string, Crumb[]> = {
  neo: ["Neo"],
  dashboard: ["Dashboard"],
  inbox: ["Workspace", "Inbox"],
  purchases: ["Books", "Purchases"],
  sales: ["Books", "Sales"],
  "journal-vouchers": ["Books", "Journal Vouchers"],
  "chart-of-accounts": ["Books", "Chart of Accounts"],
  inventory: ["Books", "Stock items"],
  gst: ["Compliance", "GST Reconciliation"],
  banking: ["Banking", "Bank accounts"],
  activity: ["Automation", "Activity log"],
  rules: ["Automation", "Rules & learning"],
  checks: ["Compliance", "Compliance checks"],
  policy: ["Automation", "Client policy"],
  playbooks: ["Neo", "Routines"],
  whatsapp: ["Automation", "WhatsApp"],
};

const COLLAPSE_KEY = "sb-collapsed";
const ICON = "flex-none [&>svg]:size-5";
/*
  Every top-level row is the same box: 36px, no border, so icons and labels
  sit on one line whether the row is a link or a group. The current page is a
  soft brand fill with a 3px rail on the sidebar's edge and a medium label
  (9 Nov 2026, on the pale Ink Navy wash; it was a raised pill on navy).
*/
const NAV_ROW =
  "group relative flex h-9 items-center rounded-md border border-transparent text-body transition-colors duration-150";
const NAV_TAG =
  "flex-none rounded-xs bg-[var(--nav-tag-bg)] px-1.5 py-px text-overline font-semibold uppercase text-[var(--nav-tag-ink)]";

const SidebarLayout = ({
  children,
  defaultSidebarState,
  contentClassName,
  crumbs,
  inboxCount,
  onGuide,
  onNavSelect,
  activeNavId,
  companies,
  companyId,
  onCompanyChange,
  onCompanyCreate,
  onCompanyRename,
  companyAction,
}: Props) => {
  const router = useRouter();
  const current =
    activeNavId ?? (router.pathname.startsWith("/inbox") ? "inbox" : "");
  const activeGroup = NAV.find(
    (n) => n.kind === "group" && n.children.some((c) => c.id === current)
  )?.id;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (activeGroup)
      setOpen((o) => (o[activeGroup] ? o : { ...o, [activeGroup]: true }));
  }, [activeGroup]);

  const [desktopCollapsed, setCollapsed] = useState(
    defaultSidebarState !== undefined ? !defaultSidebarState : false
  );
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1050px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  // sessionStorage in an effect keeps server and client markup identical.
  useEffect(() => {
    const stored = window.sessionStorage.getItem(COLLAPSE_KEY);
    if (stored !== null) setCollapsed(stored === "1");
  }, []);
  useEffect(() => {
    window.sessionStorage.setItem(COLLAPSE_KEY, desktopCollapsed ? "1" : "0");
  }, [desktopCollapsed]);
  /*
    A page can ask for the icon rail while it needs the width — the Inbox does
    while a record is docked beside its table. An ask, not a write: it is not
    saved, so the user's own setting comes back when the page stops asking,
    and pressing the toggle overrides it.
  */
  const [asked, setAsked] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    setAsked(
      defaultSidebarState === undefined ? undefined : !defaultSidebarState
    );
  }, [defaultSidebarState]);
  const choose = (next: boolean) => {
    setAsked(undefined);
    setCollapsed(next);
  };
  const collapsed = compact || (asked ?? desktopCollapsed);

  // Prototype-only: bank lines not yet approved, read live from the banking
  // store so the count falls as lines are approved.
  const { transactions: bankLines } = useBanking(companyId ?? "");
  const bankingCount = bankLines.filter((txn) => !txn.accoutingReady).length;
  const company = companies?.find((c) => c.companyUuid === companyId);
  const companyName = company?.companyName ?? "Acme Foods";

  const select = (id: string) => (e: React.MouseEvent) => {
    if (!onNavSelect) return;
    e.preventDefault();
    onNavSelect(id);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-pi-page">
      {/* Skips the rail and the top bar for keyboard users (27 Oct 2026). */}
      <a
        href="#main-content"
        className="sr-only z-50 rounded-sm bg-background px-3 py-2 text-small font-medium text-pi-brand shadow-pi-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside
        data-collapsed={collapsed}
        className={cn(
          "workbench-sidebar flex h-full flex-none flex-col transition-[width] duration-200 ease-out motion-reduce:transition-none",
          collapsed ? "w-16" : "w-[216px]"
        )}
      >
        <div
          className={cn(
            "flex h-14 flex-none items-center gap-2.5 border-b border-[var(--nav-line)]",
            collapsed ? "justify-center" : "pl-5"
          )}
        >
          <Image
            src={`${basePath}/images/ai-accountant-mark.png`}
            alt="AI Accountant"
            width={28}
            height={30}
            // The logo follows the sidebar (styles/palette.css): dark on the pale wash, white in dark mode.
            className="h-6 w-[22px] flex-none object-contain brightness-0 invert"
            unoptimized
            priority
          />
          {!collapsed && (
            <span className="whitespace-nowrap text-lead font-semibold tracking-[-0.01em] text-[var(--nav-ink)]">
              AI Accountant
            </span>
          )}
        </div>

        <nav
          id="prototype-main-navigation"
          aria-label="Main"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pb-4 pt-3"
        >
          {SECTIONS.map((section, sectionIndex) => (
            <div
              key={section.heading ?? sectionIndex}
              role="group"
              aria-label={section.heading}
              className={cn("flex flex-col gap-0.5", sectionIndex > 0 && "mt-5")}
            >
              {section.heading &&
                (collapsed ? (
                  // The rail has no room for words: a short rule says
                  // where one section ends.
                  <span
                    aria-hidden
                    className="mx-auto mb-1 h-px w-6 bg-[var(--nav-line)]"
                  />
                ) : (
                  <p className="mb-1 px-3 text-overline font-semibold uppercase tracking-[0.06em] text-[var(--nav-faint)]">
                    {section.heading}
                  </p>
                ))}
          {section.nodes.map((node) => {
            if (node.kind === "item") {
              const active = current === node.id;
              // What is waiting, as a plain figure at the row's end: the
              // number is the news, so it needs no chip (5 Nov 2026).
              const badge =
                node.id === "inbox"
                  ? inboxCount
                  : node.id === "banking"
                    ? bankingCount
                    : undefined;
              return (
                <Link
                  key={node.id}
                  href={node.path}
                  onClick={select(node.id)}
                  aria-current={active ? "page" : undefined}
                  data-guide-id={`nav-${node.id}`}
                  title={
                    collapsed
                      ? badge
                        ? `${node.label} · ${badge} to review`
                        : node.label
                      : undefined
                  }
                  aria-label={
                    collapsed
                      ? badge
                        ? `${node.label}, ${badge} to review`
                        : node.label
                      : undefined
                  }
                  className={cn(
                    NAV_ROW,
                    collapsed ? "justify-center" : "gap-3 px-3",
                    active
                      ? cn(
                          "bg-[var(--nav-active-bg)] font-medium text-[var(--nav-active-ink)]",
                          // The rail sits on the sidebar's own edge, past
                          // the nav's 8px padding.
                          !collapsed &&
                            "before:absolute before:-left-2 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-[var(--nav-active-rail)]"
                        )
                      : "text-[var(--nav-body)] hover:bg-[var(--nav-hover)] hover:text-[var(--nav-ink)]"
                  )}
                >
                  <span
                    className={cn(ICON, iconStyles.icon)}
                    data-active={active}
                  >
                    {node.icon}
                  </span>
                  {!collapsed && (
                    <span className="flex-1 truncate">{node.label}</span>
                  )}
                  {/* The launch tag gave way to the count (5 Nov 2026):
                      "22 waiting" is news every day, "New" only once. */}
                  {badge && collapsed ? (
                    // No room for a count on the icon rail: a dot on the
                    // icon's corner, the count in its tooltip.
                    <span
                      aria-hidden
                      className={cn(
                        "nav-unread-dot absolute rounded-full",
                        active
                          ? "bg-[var(--nav-active-rail)]"
                          : "bg-[var(--nav-active-rail)]"
                      )}
                    />
                  ) : badge ? (
                    <span
                      className={cn(
                        "flex-none text-small font-medium tabular-nums",
                        active
                          ? "text-[var(--nav-active-ink)]"
                          : "text-[var(--nav-ink)]"
                      )}
                    >
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            }
            const isOpen = !collapsed && !!open[node.id];
            const childActive = node.children.some((c) => c.id === current);
            return (
              <div key={node.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      choose(false);
                      setOpen((o) => ({ ...o, [node.id]: true }));
                    } else setOpen((o) => ({ ...o, [node.id]: !o[node.id] }));
                  }}
                  aria-expanded={isOpen}
                  title={collapsed ? node.label : undefined}
                  aria-label={collapsed ? node.label : undefined}
                  data-guide-id={`nav-${node.id}`}
                  className={cn(
                    NAV_ROW,
                    "w-full hover:bg-[var(--nav-hover)] hover:text-[var(--nav-ink)]",
                    collapsed ? "justify-center" : "gap-3 px-3",
                    childActive && collapsed
                      ? "text-[var(--nav-ink)]"
                      : "text-[var(--nav-body)]"
                  )}
                >
                  <span
                    className={cn(ICON, iconStyles.icon)}
                    data-active={childActive}
                  >
                    {node.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{node.label}</span>
                      <ChevronRight
                        className={cn(
                          "size-4 flex-none text-[var(--nav-faint)] opacity-70 transition-[transform,opacity] duration-200 group-hover:opacity-100",
                          isOpen && "rotate-90"
                        )}
                      />
                    </>
                  )}
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="relative pb-1 pt-1">
                      <span
                        aria-hidden
                        className="absolute bottom-2 left-[21.5px] top-1 w-px bg-[var(--nav-line)]"
                      />
                      <div className="flex flex-col gap-0.5">
                        {node.children.map((child) => {
                          const active = current === child.id;
                          return (
                            <Link
                              key={child.id}
                              href={child.path}
                              onClick={select(child.id)}
                              aria-current={active ? "page" : undefined}
                              data-guide-id={`nav-${child.id}`}
                              tabIndex={isOpen ? undefined : -1}
                              className={cn(
                                "relative ml-8 flex h-8 items-center rounded-sm px-3 text-small transition-colors duration-[120ms]",
                                active
                                  ? "bg-[var(--nav-active-bg)] font-medium text-[var(--nav-active-ink)] before:absolute before:-left-10 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-[var(--nav-active-rail)]"
                                  : "text-[var(--nav-body)] hover:bg-[var(--nav-hover)] hover:text-[var(--nav-ink)]"
                              )}
                            >
                              <span className="flex-1 truncate">
                                {child.label}
                              </span>
                              {child.tag && (
                                <span className={NAV_TAG}>{child.tag}</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          ))}
        </nav>

        {/* No company card here (8 Oct 2026): the organisation chip in the
            top bar already names it. */}
        <div
          className={cn(
            "mt-auto flex h-12 flex-none items-center border-t border-[var(--nav-line)]",
            collapsed ? "justify-center" : "px-2"
          )}
        >
          <button
            type="button"
            onClick={() => choose(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="prototype-main-navigation"
            className={cn(
              "hidden h-8 flex-none items-center gap-3 rounded-sm text-small text-[var(--nav-faint)] transition-colors hover:bg-[var(--nav-hover)] hover:text-[var(--nav-body)] md:flex",
              collapsed ? "w-8 justify-center" : "w-full px-3"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 flex-none" />
            ) : (
              <>
                <PanelLeftClose className="size-5 flex-none" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopBar
          crumbs={crumbs?.length ? crumbs : (NAV_TRAIL[current] ?? [])}
          company={{ initials: companyName.charAt(0), name: companyName }}
          user={{ initials: "SB", email: "sandeep.balaji@aiaccountant.com" }}
          onGuide={onGuide}
          companies={companies}
          companyId={companyId}
          onCompanyChange={onCompanyChange}
          onCompanyCreate={onCompanyCreate}
          onCompanyRename={onCompanyRename}
          companyAction={companyAction}
          destinations={NAV_DESTINATIONS}
          onDestination={onNavSelect}
        />
        <NeoPresence />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-pi-page focus:outline-none"
        >
          <div
            className={cn("min-w-0 flex-1 overflow-hidden", contentClassName)}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
