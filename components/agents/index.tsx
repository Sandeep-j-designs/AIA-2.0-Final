import React, { useEffect, useState } from "react";
import CollectionSetup from "./collection-setup";
import {
  startCollectionDraft,
  collectionDraft,
  patchCollectionDraft,
} from "@/hooks/pages/inbox/use-inbox-sources";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { useCollectionAgent } from "@/hooks/pages/agents/use-collection-agent";
import {
  setDraftChannel,
  setSourceStatus,
} from "@/hooks/pages/inbox/use-inbox-sources";
import { SOURCE_SCOPES } from "@/config/pages/inbox/mock-sources";
import AgentOverview from "@/components/agents/agent-overview";
import CollectionCard from "@/components/neo/common/collection-card";
import {
  ArrowLeft,
  Clock,
  Inbox,
  NeoStar,
  Play,
  Settings,
} from "@/components/icons";
import { ProviderIcon } from "@/components/agents/provider-icon";

/**
 * Document collection's own screen, under Neo › Agents. Setting it up and
 * changing it happen in Neo's chat (19 Oct 2026): this screen shows how it
 * is set up and what it has collected, and runs it.
 *
 * DEV: use useRoutedListState for the tab key in the production route.
 */
const Agents = ({ company }: { company: string }) => {
  const router = useRouter();
  const c = useCollectionAgent(company);
  const [editing, setEditing] = useState(false);
  const editSetup = () => {
    if (!collectionDraft(company)) startCollectionDraft(company);
    patchCollectionDraft(company, { notify: "off" }, true);
    // Start with Gmail on, so the first screen already shows a preview.
    const draft = collectionDraft(company);
    if (draft && !draft.channels.some((ch) => ch.status === "connected"))
      setDraftChannel(company, {
        provider: "Gmail",
        status: "connected",
        account: "accounts@example.test",
        scope: SOURCE_SCOPES.Gmail[0],
      });
    setEditing(true);
  };
  // ?setup=1 (from the agents list) opens straight on the setup.
  useEffect(() => {
    if (router.query.setup && !c.agent.configured) editSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.setup]);
  const tab = ["overview", "configuration", "activity"].includes(
    String(router.query.tab)
  )
    ? String(router.query.tab)
    : "overview";
  const go = (nextTab?: string) =>
    void router.push(
      nextTab
        ? `/inbox?module=NEO&page=agents&agent=document-collection&tab=${nextTab}`
        : "/inbox?module=NEO&page=agents"
    );
  const draft = !c.agent.configured && !!c.agent.setup;
  const modeLabel =
    c.agent.runMode === "continuous" ? "Every 15 minutes" : "When you ask";

  return (
    <div className="neo-skills-scroll min-h-0 min-w-0 flex-1 overflow-auto">
      <div className="neo-skills-content agent-detail-wrap">
        <Button variant="ghost" className="mb-5 -ml-3" onClick={() => go()}>
          <ArrowLeft />
          All agents
        </Button>
        <div className="agent-detail-panel">
          <header className="agent-detail-header flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-pi-line bg-background text-pi-brand">
                <NeoStar className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-h3 text-pi-ink">Document collection</h1>
                <p className="mt-0.5 text-body text-pi-body">
                  Collects supplier bills and prepares drafts for your review.
                </p>
              </div>
            </div>
            {editing ? null : c.agent.configured ? (
              <span className="inline-flex items-center gap-2 rounded-xs border border-pi-line bg-background px-2 py-1 text-caption text-pi-body">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${c.agent.paused || !c.connected.length ? "bg-pi-warning" : "bg-pi-success"}`}
                />
                {modeLabel} · {c.status}
              </span>
            ) : (
              <Button disabled={editing} onClick={editSetup}>
                {draft ? "Continue setup" : "Set up agent"}
              </Button>
            )}
          </header>

          <div className="agent-detail-body">
            {editing ? (
              <CollectionSetup
                company={company}
                onDone={() => setEditing(false)}
              />
            ) : !c.agent.configured ? (
              <section className="grid gap-6 rounded-md border border-pi-line bg-background p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
                <div className="space-y-3 text-body leading-6 text-pi-body">
                  <h2 className="text-body font-semibold text-pi-ink">
                    {draft ? "Saved as a draft" : "Let documents come to you"}
                  </h2>
                  <p>
                    {draft
                      ? "The setup is saved but not running. Continue setup to change it, see the dry run again and turn it on."
                      : "Connect an email label or a shared folder, choose which documents to collect, and preview the results before activating the agent."}
                  </p>
                  <p>
                    Collected bills arrive as drafts. Nothing is approved,
                    posted or sent without you.
                  </p>
                </div>
                {draft && (
                  <CollectionCard
                    hideNotices
                    card={{ kind: "collection-setup", company }}
                  />
                )}
              </section>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div
                    role="tablist"
                    aria-label="Document collection"
                    className="inline-flex gap-1 rounded-md border border-pi-line bg-pi-sunken p-1"
                  >
                    {[
                      { id: "overview", label: "Overview", icon: Inbox },
                      { id: "configuration", label: "Setup", icon: Settings },
                      { id: "activity", label: "Activity", icon: Clock },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={tab === id}
                        data-state={tab === id ? "active" : "inactive"}
                        onClick={() => go(id)}
                        className={`flex items-center gap-2 rounded-sm px-2 py-1 text-caption transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-pi-brand sm:px-3 sm:text-body ${tab === id ? "bg-background font-medium text-pi-brand shadow-sm" : "text-pi-body hover:text-pi-ink"}`}
                      >
                        <Icon className="hidden h-4 w-4 sm:block" />
                        {label}
                      </button>
                    ))}
                  </div>
                  {tab !== "overview" && (
                    <div className="flex flex-wrap gap-2">
                      {c.busy ? (
                        <Button variant="outline" onClick={c.stop}>
                          Stop task
                        </Button>
                      ) : (
                        <Button
                          disabled={!c.connected.length || c.neoBusy}
                          onClick={c.run}
                        >
                          <Play />
                          Run now
                        </Button>
                      )}
                      {c.agent.runMode === "continuous" && (
                        <Button variant="ghost" onClick={c.pause}>
                          {c.agent.paused ? "Resume agent" : "Pause agent"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div
                  key={tab}
                  className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
                >
                  {tab === "overview" && (
                    <AgentOverview
                      controller={c}
                      onConfigure={() => go("configuration")}
                      onActivity={() => go("activity")}
                      onInbox={() => void router.push("/inbox")}
                      onDocument={(id) =>
                        void router.push(`/inbox?id=${encodeURIComponent(id)}`)
                      }
                    />
                  )}
                  {tab === "configuration" && (
                    <div className="grid gap-card lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
                      <div className="space-y-3">
                        <CollectionCard
                          hideNotices
                          card={{ kind: "collection-setup", company }}
                        />
                        <Button
                          variant="outline"
                          disabled={c.busy || c.neoBusy}
                          onClick={editSetup}
                        >
                          Edit sources and rules
                        </Button>
                      </div>
                      <section className="space-y-3 rounded-md border border-pi-line bg-background p-card-lg">
                        <h2 className="text-body font-semibold text-pi-ink">
                          Channels
                        </h2>
                        {c.sources.map((s) => (
                          <article
                            key={s.id}
                            className="flex flex-wrap items-start gap-3 border-t border-pi-line pt-3 text-body first-of-type:border-t-0 first-of-type:pt-0"
                          >
                            <ProviderIcon provider={s.provider} />
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-pi-ink">
                                  {s.provider === "Forwarding"
                                    ? "Forwarding address"
                                    : s.provider}
                                </span>
                                <span className="text-caption capitalize text-pi-body">
                                  {s.status}
                                </span>
                              </p>
                              <p className="mt-0.5 break-all text-caption text-pi-body">
                                {s.account} · {s.scope}
                              </p>
                              <p className="mt-0.5 text-caption text-pi-faint">
                                {s.lastChecked
                                  ? `Last checked ${new Date(s.lastChecked).toLocaleString("en-IN")}`
                                  : "Not checked yet"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={c.busy || c.neoBusy}
                              onClick={() =>
                                setSourceStatus(
                                  s.id,
                                  s.status === "connected"
                                    ? "disconnected"
                                    : "connected"
                                )
                              }
                            >
                              {s.status === "connected"
                                ? "Disconnect"
                                : "Reconnect"}
                            </Button>
                          </article>
                        ))}
                      </section>
                    </div>
                  )}
                  {tab === "activity" && (
                    <section className="space-y-4 rounded-md border border-pi-line bg-background p-6">
                      <div>
                        <h2 className="text-body font-semibold text-pi-ink">
                          Collection history
                        </h2>
                        <p className="mt-1 text-body text-pi-body">
                          Every run, the documents it found, and what needs your
                          attention.
                        </p>
                      </div>
                      {!c.runs.length && (
                        <p className="rounded-md bg-pi-sunken px-6 py-12 text-center text-body text-pi-body">
                          No tasks yet.{" "}
                          {c.agent.runMode === "on-demand"
                            ? "Run now or ask Neo when you’re ready."
                            : "The next background check will appear here."}
                        </p>
                      )}
                      {c.runs.map((r) => (
                        <article
                          key={r.id}
                          className="rounded-md border border-pi-line bg-background p-card-lg text-body"
                        >
                          <div className="flex justify-between gap-3">
                            <h2 className="font-medium">
                              {r.trigger === "continuous"
                                ? "Background collection"
                                : "Requested collection"}
                            </h2>
                            <span className="capitalize text-pi-body">
                              {r.status}
                            </span>
                          </div>
                          <p className="mt-2 text-pi-body">{r.summary}</p>
                          <p className="mt-2 text-caption text-pi-body">
                            {new Date(r.startedAt).toLocaleString("en-IN")}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.itemIds.map((id) => (
                              <Button
                                key={id}
                                variant="outline"
                                onClick={() =>
                                  void router.push(`/inbox?id=${id}`)
                                }
                              >
                                {id.replace(`COLLECT-${company}-`, "")}
                              </Button>
                            ))}
                            {["failed", "stopped"].includes(r.status) && (
                              <Button
                                variant="secondary"
                                disabled={
                                  c.busy || c.neoBusy || !c.connected.length
                                }
                                onClick={c.run}
                              >
                                Retry task
                              </Button>
                            )}
                          </div>
                        </article>
                      ))}
                    </section>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Agents;
