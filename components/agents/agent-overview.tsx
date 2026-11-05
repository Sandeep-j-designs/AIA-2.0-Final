import { Button } from "@/components/ui/button";
import { ProviderIcon } from "./provider-icon";
import type { useCollectionAgent } from "@/hooks/pages/agents/use-collection-agent";

type Props = {
  controller: ReturnType<typeof useCollectionAgent>;
  onConfigure: () => void;
  onActivity: () => void;
  onInbox: () => void;
  onDocument: (id: string) => void;
};
export default function AgentOverview({
  controller: c,
  onConfigure,
  onActivity,
  onInbox,
}: Props) {
  const latest = c.runs[0];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={!c.connected.length || c.neoBusy || c.busy}
          onClick={c.run}
        >
          Run now
        </Button>
        {c.busy && (
          <Button variant="outline" onClick={c.stop}>
            Stop task
          </Button>
        )}
        {c.agent.runMode === "continuous" && (
          <Button variant="outline" onClick={c.pause}>
            {c.agent.paused ? "Resume agent" : "Pause agent"}
          </Button>
        )}
        <Button variant="ghost" onClick={onInbox}>
          Open Inbox
        </Button>
      </div>
      <div className="grid items-start gap-5 md:grid-cols-2">
        <section className="rounded-md border border-pi-line bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-body font-semibold">Sources</h2>
            <Button variant="ghost" size="sm" onClick={onConfigure}>
              Manage sources
            </Button>
          </div>
          <ul className="mt-3 divide-y divide-pi-line">
            {c.sources.map((s) => (
              <li key={s.id} className="flex gap-3 py-4">
                <ProviderIcon provider={s.provider} />
                <div className="min-w-0">
                  <p className="text-small font-medium">
                    {s.provider}{" "}
                    <span className="ml-2 text-caption font-normal capitalize text-pi-body">
                      {s.status}
                    </span>
                  </p>
                  <p className="mt-1 break-all text-caption text-pi-body">
                    {s.account}
                  </p>
                  <p className="mt-1 text-caption text-pi-body">{s.scope}</p>
                </div>
              </li>
            ))}
          </ul>
          {!c.sources.length && (
            <p className="mt-3 text-small text-pi-body">
              Connect a source to begin collecting documents.
            </p>
          )}
        </section>
        <section className="rounded-md border border-pi-line bg-background p-5">
          <h2 className="text-body font-semibold">How this agent works</h2>
          <dl className="mt-4 space-y-4 text-small">
            <div>
              <dt className="text-pi-body">Checks</dt>
              <dd className="mt-1">
                {c.agent.paused
                  ? "Paused"
                  : c.agent.runMode === "continuous"
                    ? "Every 15 minutes while this app is open"
                    : "Only when you ask"}
              </dd>
            </div>
            <div>
              <dt className="text-pi-body">Collects</dt>
              <dd className="mt-1">
                {c.agent.setup?.files === "all"
                  ? "Supplier bills; other documents held for review"
                  : "Supplier bills only"}
              </dd>
            </div>
            <div>
              <dt className="text-pi-body">Senders</dt>
              <dd className="mt-1">
                {c.agent.setup?.senders === "anyone"
                  ? "Anyone in the selected sources"
                  : "Known suppliers and staff"}
              </dd>
            </div>
            <div>
              <dt className="text-pi-body">Last run</dt>
              <dd className="mt-1">
                {latest
                  ? `${new Date(latest.startedAt).toLocaleString()} · ${latest.status}`
                  : "Not run yet"}
              </dd>
            </div>
          </dl>
          <Button className="mt-4" variant="outline" onClick={onActivity}>
            View activity
          </Button>
        </section>
      </div>
      <p className="text-caption leading-5 text-pi-body">
        Prototype connections use sample documents. Collection adds drafts to
        Inbox and checks for duplicates. Approval, posting and outgoing messages
        remain under your control.
      </p>
    </div>
  );
}
