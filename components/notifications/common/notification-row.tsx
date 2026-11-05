import { Check, DotFilled } from "@/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import NotificationGlyph from "@/components/notifications/common/notification-glyph";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/pages/notifications";
import { fullTime, timeAgo } from "@/utils/pages/notifications";

type Props = {
  notification: Notification;
  /** Go to the notice's target. The caller marks it read and closes. */
  onOpen: (notification: Notification) => void;
  onToggleRead: (notification: Notification) => void;
  /** The full page gives the body two lines more and shows who did it. */
  roomy?: boolean;
};

/** A compact linked notice, with a timestamp and a read toggle. */
const NotificationRow = ({
  notification: n,
  onOpen,
  onToggleRead,
  roomy,
}: Props) => {
  const unread = !n.readAt;

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors duration-100 hover:bg-pi-row-hover",
        roomy && "px-6 py-4"
      )}
    >
      <NotificationGlyph notification={n} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => onOpen(n)}
            className={cn(
              "min-w-0 text-left text-small leading-5 outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring",
              unread ? "font-semibold text-pi-ink" : "font-medium text-pi-ink"
            )}
          >
            {n.title}
          </button>
          {unread ? (
            <span
              aria-label="Unread"
              className="mt-2 size-2 flex-none rounded-full bg-pi-brand"
            />
          ) : null}
        </div>

        {n.body ? (
          <p
            className={cn(
              "mt-0.5 text-small leading-5 text-pi-body",
              roomy ? "line-clamp-3" : "line-clamp-2"
            )}
          >
            {n.body}
          </p>
        ) : null}

        <div className="mt-1 text-caption leading-4 text-pi-faint">
          <span>
            <time dateTime={n.createdAt} title={fullTime(n.createdAt)}>
              {timeAgo(n.createdAt)}
            </time>
          </span>
        </div>
      </div>

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={unread ? "Mark as read" : "Mark as unread"}
              onClick={() => onToggleRead(n)}
              className="relative z-[1] -mr-1 grid size-7 flex-none place-items-center self-start rounded-sm text-pi-faint opacity-0 transition-opacity duration-100 hover:bg-pi-fill hover:text-pi-body focus-visible:opacity-100 group-hover:opacity-100"
            >
              {unread ? (
                <Check className="size-4" />
              ) : (
                <DotFilled className="size-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {unread ? "Mark as read" : "Mark as unread"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default NotificationRow;
