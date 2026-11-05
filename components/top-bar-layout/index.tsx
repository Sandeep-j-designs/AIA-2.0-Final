import React, { ReactNode, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronsUpDown,
  LifeBuoy,
  LogOut,
  MonitorPlay,
  Moon,
  Search,
  Sun,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/notifications/bell";
import NeoLauncher from "@/components/neo/common/launcher";
import { notificationActions } from "@/hooks/pages/notifications/use-notifications";
import { cn } from "@/lib/utils";
import type { UserCompany } from "@/types/pages/organisation";
import OrganisationSwitcher from "./organization-switcher";
import CommandPalette, { type Destination } from "./command-palette";

/**
 * Precision Indigo top bar, after ai-accountant-redesign src/components/
 * TopBar.tsx and the workbench `.app-topbar`:
 * - a 56px white bar with a section / page breadcrumb on the left;
 * - a search pill with its ⌘K hint: the command palette (go to a page, find
 *   a document, or search the current screen);
 * - the organisation chip, the company-scoped action slot (ERP sync),
 *   notifications, preferences and the profile.
 */

/** A plain label, or one that goes somewhere: a page above the current one. */
export type Crumb =
  | string
  | { label: string; onClick: () => void }
  /** A crumb that is a control of its own, like Neo's chat title menu. */
  | { node: ReactNode; label: string };

/** Profile menu items whose pages are not included in the prototype. */
const notIncluded = (what: string) =>
  toast(`${what} is not included in this prototype.`);
const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: MonitorPlay },
] as const;
/** A desk's heading: the owner, in the caption face, no caps. */
const DESK_HEAD =
  "flex items-center justify-between gap-2 px-2 pb-1 pt-1 text-caption font-medium text-pi-faint";
/** A row in the profile menu: words only, the heading says whose it is. */
const DESK_ROW = "h-8 px-2 py-0 text-small text-pi-ink";
/** "sandeep.balaji@…" reads as "Sandeep Balaji" until the user has a name. */
const nameFromEmail = (email: string) =>
  email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

type Props = {
  crumbs?: Crumb[];
  company: { initials: string; name: string };
  user: { initials: string; email: string; name?: string };
  leadingContent?: ReactNode;
  onGuide?: () => void;
  companies?: UserCompany[];
  companyId?: string;
  onCompanyChange?: (id: string) => void;
  onCompanyCreate?: (name: string) => string;
  onCompanyRename?: (id: string, name: string) => void;
  /** Rendered after the organisation chip: the company-scoped ERP sync. */
  companyAction?: ReactNode;
  /** The pages the command palette offers under Go to. */
  destinations?: Destination[];
  /** The rail's own navigation, which the palette's Go to reuses. */
  onDestination?: (id: string) => void;
};

const iconButton =
  "grid size-8 sm:size-9 flex-none place-items-center rounded-sm text-pi-faint transition-colors duration-150 hover:bg-pi-fill hover:text-pi-body data-[state=open]:bg-pi-fill";

/** The page's own search listens for "/", so the pill and ⌘K both send it. */
const focusPageSearch = () =>
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "/", bubbles: true })
  );

const AppTopBar = ({
  crumbs = [],
  company,
  user,
  leadingContent,
  onGuide,
  companies,
  companyId,
  onCompanyChange,
  onCompanyCreate,
  onCompanyRename,
  companyAction,
  destinations = [],
  onDestination,
}: Props) => {
  const { theme = "light", setTheme } = useTheme();
  const userName = user.name || nameFromEmail(user.email);
  const [isMac, setIsMac] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 flex-none items-center gap-0.5 border-b border-pi-line bg-background px-2 sm:px-6">
      {leadingContent}
      <div className="hidden min-w-0 items-center gap-2 text-body sm:flex">
        {crumbs.map((crumb, i) => {
          const label = typeof crumb === "string" ? crumb : crumb.label;
          const last = i === crumbs.length - 1;
          return (
            <React.Fragment key={`${i}-${label}`}>
              {i > 0 && <span className="flex-none text-pi-faint">/</span>}
              {typeof crumb !== "string" && "node" in crumb ? (
                <span className="min-w-0">{crumb.node}</span>
              ) : typeof crumb !== "string" && !last ? (
                // Back up the trail: the page this one was opened from.
                <button
                  type="button"
                  onClick={"onClick" in crumb ? crumb.onClick : undefined}
                  className="-mx-1 flex-none rounded-xs px-1 text-pi-body transition-colors hover:bg-pi-fill hover:text-pi-ink"
                >
                  {label}
                </button>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(
                    last
                      ? "min-w-0 truncate font-medium text-pi-ink"
                      : "flex-none text-pi-body"
                  )}
                >
                  {label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="min-w-0 flex-1 sm:min-w-4" />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        destinations={destinations}
        onSearchPage={focusPageSearch}
        onDestination={onDestination}
      />

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-haspopup="dialog"
        className="hidden h-control w-[280px] flex-none items-center gap-2 rounded-sm bg-pi-fill px-3 text-small text-pi-faint transition-[background-color] duration-150 hover:bg-pi-fill-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand focus-visible:ring-offset-2 lg:flex"
      >
        <Search className="size-4 flex-none" />
        <span className="flex-1 truncate text-left">Go to or find…</span>
        <kbd className="flex-none rounded-xs border border-pi-line bg-background px-1 py-0.5 font-sans text-caption font-medium text-pi-faint shadow-[inset_0_-1px_var(--pi-line)]">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      {companies?.length && onCompanyChange ? (
        <OrganisationSwitcher
          companies={companies}
          selectedCompanyUuid={companyId}
          onSelect={onCompanyChange}
          onCreate={onCompanyCreate ?? (() => companyId ?? "")}
          onRename={onCompanyRename ?? (() => undefined)}
          className="sm:ml-2 w-[58px] shrink-0 sm:w-[210px] xl:w-[230px]"
        />
      ) : (
        <span className="ml-3 flex h-9 max-w-[280px] items-center gap-2 overflow-hidden rounded-sm border border-pi-line-2 bg-background py-1 pl-2 pr-3">
          <span className="grid size-6 place-items-center rounded-xs bg-pi-brand text-caption font-semibold text-white">
            {company.initials}
          </span>
          <span className="min-w-0 flex-1 truncate text-small font-semibold text-pi-ink">
            {company.name}
          </span>
          <ChevronsUpDown className="ml-auto size-3.5 flex-none text-pi-faint" />
        </span>
      )}

      <div className="mx-2 h-5 w-px sm:mx-3 flex-none bg-pi-line" />

      <div className="flex flex-none items-center gap-0.5 sm:gap-2">
        {companyAction}

        <NeoLauncher className="text-pi-body hover:bg-pi-row-hover" />
        {companyId ? (
          <NotificationBell
            companyId={companyId}
            companies={companies ?? []}
            onCompanyChange={onCompanyChange}
            className={iconButton}
          />
        ) : null}

        {/* Profile (5 Nov 2026): the one menu for you, your settings and the
            organisation's. It took in the old Preferences gear, so settings
            have one door. Items not included in the prototype say so in a toast. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Profile and settings"
              title={user.email}
              className="ml-1 grid size-8 flex-none place-items-center rounded-full bg-pi-fill-2 text-caption font-semibold text-pi-body transition-colors hover:bg-pi-line-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {user.initials}
            </button>
          </DropdownMenuTrigger>
          {/* Two desks (5 Nov 2026): what is yours on the left, what is the
              organisation's on the right, so every setting sits under who
              owns it and the company is named once. Appearance is a switch,
              not a submenu, beside Log out in the foot. */}
          <DropdownMenuContent align="end" className="w-[440px] p-0">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 flex-none place-items-center rounded-full bg-pi-fill-2 text-caption font-semibold text-pi-body">
                {user.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-body font-semibold text-pi-ink">
                  {userName}
                </span>
                <span className="block truncate text-caption text-pi-faint">
                  {user.email}
                </span>
              </span>
            </div>
            <DropdownMenuSeparator className="m-0" />
            <div className="grid grid-cols-2 divide-x divide-pi-line">
              <div className="p-2">
                <p className={DESK_HEAD}>You</p>
                <DropdownMenuItem className={DESK_ROW} onSelect={() => notIncluded("My profile")}>
                  My profile
                </DropdownMenuItem>
                <DropdownMenuItem className={DESK_ROW} onSelect={notificationActions.openSettings}>
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem className={DESK_ROW} onSelect={() => notIncluded("Keyboard shortcuts")}>
                  Keyboard shortcuts
                </DropdownMenuItem>
              </div>
              <div className="p-2">
                <p className={DESK_HEAD}>
                  <span className="truncate">{company.name}</span>
                  <span className="flex-none text-pi-faint">Admin</span>
                </p>
                <DropdownMenuItem className={DESK_ROW} onSelect={() => notIncluded("Organisation settings")}>
                  Organisation settings
                </DropdownMenuItem>
                <DropdownMenuItem className={DESK_ROW} onSelect={() => notIncluded("Users and roles")}>
                  Users and roles
                </DropdownMenuItem>
                <DropdownMenuItem className={DESK_ROW} onSelect={() => notIncluded("ERP and integrations")}>
                  ERP and integrations
                </DropdownMenuItem>
                <DropdownMenuItem className={DESK_ROW} onSelect={() => notIncluded("Plan and billing")}>
                  Plan and billing
                </DropdownMenuItem>
              </div>
            </div>
            <DropdownMenuSeparator className="m-0" />
            <div className="flex items-center gap-1 p-2">
              {onGuide && (
                <DropdownMenuItem className={cn(DESK_ROW, "text-pi-body")} onSelect={onGuide}>
                  <BookOpen />
                  Guide and what&apos;s new
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className={cn(DESK_ROW, "text-pi-body")} onSelect={() => notIncluded("Help and support")}>
                <LifeBuoy />
                Help and support
              </DropdownMenuItem>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-pi-line bg-pi-page px-3 py-2">
              <div
                role="group"
                aria-label="Appearance"
                className="flex rounded-sm bg-pi-fill p-0.5"
              >
                {THEMES.map(({ value, label, Icon }) => (
                  <DropdownMenuItem
                    key={value}
                    role="menuitemradio"
                    aria-checked={theme === value}
                    // Stays open: the switch shows the change it just made.
                    onSelect={(event) => {
                      event.preventDefault();
                      setTheme(value);
                    }}
                    className={cn(
                      "h-7 gap-1.5 rounded-xs px-2.5 py-0 text-caption font-medium text-pi-body focus:bg-pi-fill-2",
                      theme === value &&
                        "bg-pi-surface-panel text-pi-ink shadow-contact focus:bg-pi-surface-panel"
                    )}
                  >
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuItem
                className="h-8 gap-2 px-2.5 py-0 text-small text-pi-body"
                onSelect={() => notIncluded("Log out")}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppTopBar;
