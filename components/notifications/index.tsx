import { useState } from "react";
import { useRouter } from "next/router";
import { Inbox } from "@/components/icons";
import NotificationRow from "@/components/notifications/common/notification-row";
import EmptyState from "@/components/inbox/v2/empty-state";
import {
  notificationActions,
  useNotifications,
} from "@/hooks/pages/notifications/use-notifications";
import type { Notification } from "@/types/pages/notifications";
import { groupByDay } from "@/utils/pages/notifications";
import { cn } from "@/lib/utils";

type Props = { companyId: string; companyIds: string[] };

const Notifications = ({ companyId, companyIds }: Props) => {
  const router = useRouter();
  const { all, counts } = useNotifications(companyId, companyIds);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [limit, setLimit] = useState(30);
  const rows = unreadOnly ? all.filter((n) => !n.readAt) : all;
  const days = groupByDay(rows.slice(0, limit));
  const openOne = (n: Notification) => {
    notificationActions.markRead(n.id);
    void router.push(n.target.href);
  };
  const toggleRead = (n: Notification) =>
    n.readAt
      ? notificationActions.markUnread(n.id)
      : notificationActions.markRead(n.id);

  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-h2 text-pi-ink">
            Notifications
          </h1>
          <button
            type="button"
            disabled={!counts.unread}
            onClick={() => notificationActions.markAllRead(companyId)}
            className="rounded-md px-2 py-2 text-small font-medium text-pi-brand hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand disabled:opacity-40"
          >
            Mark all as read
          </button>
        </div>
        <div
          className="mt-4 flex gap-1 border-b border-pi-line pb-3"
          aria-label="Filter notifications"
        >
          {[false, true].map((unread) => (
            <button
              key={String(unread)}
              type="button"
              aria-pressed={unreadOnly === unread}
              onClick={() => {
                setUnreadOnly(unread);
                setLimit(30);
              }}
              className={cn(
                "rounded-md px-3 py-2 text-small font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand",
                unreadOnly === unread
                  ? "bg-pi-brand-tint text-pi-brand"
                  : "text-pi-body hover:bg-pi-fill"
              )}
            >
              {unread ? "Unread" : "All"}
            </button>
          ))}
        </div>
        {days.length ? (
          days.map((day) => (
            <section key={day.label} aria-label={day.label} className="mt-6 first-of-type:mt-4">
              <h2 className="mb-2 px-2 text-caption font-medium text-pi-faint">
                {day.label}
              </h2>
              <ul className="divide-y divide-pi-line">
                {day.items.map((n) => (
                  <li key={n.id}>
                    <NotificationRow
                      notification={n}
                      onOpen={openOne}
                      onToggleRead={toggleRead}
                      roomy
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <EmptyState
            sticky={false}
            icon={Inbox}
            title="You’re all caught up"
            body={
              unreadOnly
                ? "No unread notifications."
                : "New notifications will appear here."
            }
          />
        )}
        {rows.length > limit && (
          <button
            type="button"
            onClick={() => setLimit((value) => value + 30)}
            className="mt-4 w-full rounded-md border border-pi-line py-2 text-small font-medium text-pi-body hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand"
          >
            Show more
          </button>
        )}
      </div>
    </div>
  );
};
export default Notifications;
