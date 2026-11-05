import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ArrowRight, Bell, CheckCheck, Inbox } from "@/components/icons";
import EmptyState from "@/components/inbox/v2/empty-state";
import NotificationRow from "@/components/notifications/common/notification-row";
import SettingsDialog from "@/components/notifications/settings-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  notificationActions,
  useNotifications,
} from "@/hooks/pages/notifications/use-notifications";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/pages/notifications";
import type { UserCompany } from "@/types/pages/organisation";
import { titleWithCount } from "@/utils/pages/notifications";

type Props = {
  companyId: string;
  companies: UserCompany[];
  onCompanyChange?: (id: string) => void;
  /** The top bar's icon-button classes, so the bell matches its neighbours. */
  className?: string;
};

const NotificationBell = ({ companyId, companies, className }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { all, counts, settingsOpen } = useNotifications(
    companyId,
    companies.map((c) => c.companyUuid)
  );

  // The tab title carries the count, so it shows from another tab too.
  useEffect(() => {
    const apply = () => {
      const next = titleWithCount(document.title, counts.unread);
      // Compare trimmed: setting a title the browser then trims would
      // otherwise wake the observer forever.
      if (next.trim() !== document.title.trim()) document.title = next;
    };
    apply();
    const head = document.querySelector("title");
    if (!head) return;
    const observer = new MutationObserver(apply);
    observer.observe(head, { childList: true });
    return () => observer.disconnect();
  }, [counts.unread]);

  const openOne = (n: Notification) => {
    notificationActions.markRead(n.id);
    setOpen(false);
    void router.push(n.target.href);
  };
  const toggleRead = (n: Notification) =>
    n.readAt
      ? notificationActions.markUnread(n.id)
      : notificationActions.markRead(n.id);

  const list = all.slice(0, 8);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={
              counts.unread
                ? `Notifications, ${counts.unread} unread`
                : "Notifications"
            }
            className={cn("relative", className)}
          >
            <Bell className="size-[18px]" />
            {counts.unread > 0 ? (
              <span
                aria-hidden
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-pi-brand px-1 text-caption font-semibold leading-none tabular-nums text-white"
              >
                {counts.unread > 99 ? "99+" : counts.unread}
              </span>
            ) : null}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="flex max-h-[min(640px,calc(100dvh-80px))] w-[400px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-md p-0"
        >
          <div className="flex items-center gap-1 px-4 pb-1 pt-3">
            <h2 className="flex-1 text-body font-semibold text-pi-ink">
              Notifications
            </h2>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Mark all as read"
                    disabled={!counts.unread}
                    onClick={() => notificationActions.markAllRead(companyId)}
                    className="grid size-8 place-items-center rounded-sm text-pi-faint transition-colors hover:bg-pi-fill hover:text-pi-body disabled:pointer-events-none disabled:opacity-40"
                  >
                    <CheckCheck className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Mark all as read</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {list.length ? (
              <ul className="divide-y divide-pi-line">
                {list.map((n) => (
                  <li key={n.id}>
                    <NotificationRow
                      notification={n}
                      onOpen={openOne}
                      onToggleRead={toggleRead}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                sticky={false}
                className="py-10"
                icon={Inbox}
                title="You’re all caught up"
                body="New notifications will appear here."
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void router.push("/notifications");
            }}
            className="flex shrink-0 items-center justify-center gap-2 border-t border-pi-line px-4 py-3 text-small font-medium text-pi-brand transition-colors hover:bg-pi-row-hover"
          >
            View all notifications
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </PopoverContent>
      </Popover>
      <SettingsDialog
        open={settingsOpen}
        onClose={notificationActions.closeSettings}
      />
    </>
  );
};

export default NotificationBell;
