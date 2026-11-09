import React, { useState } from "react";
import { ProviderIcon, providerCopy } from "./provider-icon";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import NeoSelect from "@/components/neo/common/neo-select";
import {
  collectionAgent,
  collectionDraft,
  commitCollectionSetup,
  discardCollectionDraft,
  dryRunCollection,
  patchCollectionDraft,
  setDraftChannel,
  useInboxSources,
  BACKFILL_LABEL,
} from "@/hooks/pages/inbox/use-inbox-sources";
import { SOURCE_SCOPES } from "@/config/pages/inbox/mock-sources";
import type {
  SourceProvider,
  CollectionSetup as Setup,
} from "@/types/pages/inbox/sources";

const PROVIDERS: SourceProvider[] = [
  "Gmail",
  "Google Drive",
  "WhatsApp Business",
];

const DEMO_ACCOUNT: Record<string, string> = {
  Gmail: "accounts@example.test",
  "Google Drive": "finance@example.test",
  "WhatsApp Business": "Registered business number",
};

const OUTCOME: Record<string, string> = {
  prepared: "Add to Inbox",
  linked: "Link to the original",
  "needs-decision": "Hold for review",
  skipped: "Skip",
};

/**
 * Document collection set up on one screen (4 Nov 2026; was Sources →
 * Preferences → Preview). Defaults are already chosen, a source is a switch
 * with its label or folder beside it, and the preview below re-runs on every
 * change, so the one button turns it on.
 */
export default function CollectionSetup({
  company,
  onDone,
}: {
  company: string;
  onDone: () => void;
}) {
  useInboxSources();
  const setup = collectionDraft(company);
  const [error, setError] = useState("");
  if (!setup)
    return (
      <p className="text-small text-pi-body">
        Setup is no longer open. Return to the agent to start again.
      </p>
    );
  const selected = setup.channels.filter((c) => c.status === "connected");
  const valid =
    selected.length > 0 &&
    selected.every((c) => c.account.trim() && c.scope.trim());
  const results = valid ? dryRunCollection(company, setup) : [];
  const existing = collectionAgent(company).configured;
  const change = (patch: Partial<Setup>) => {
    patchCollectionDraft(company, patch, true);
    setError("");
  };
  const toggle = (provider: SourceProvider, on: boolean) => {
    const c = setup.channels.find((c) => c.provider === provider);
    setDraftChannel(company, {
      provider,
      status: on ? "connected" : "skipped",
      account: c?.account || DEMO_ACCOUNT[provider],
      scope: c?.scope || SOURCE_SCOPES[provider][0],
    });
    setError("");
  };
  const save = () => {
    try {
      commitCollectionSetup(company, "on");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings.");
    }
  };

  return (
    <div className="agent-setup">
      <p className="mb-6 text-small leading-6 text-pi-body">
        Choose where documents come from. Review the defaults below, then start collecting into Inbox.
      </p>
      <section>
        <h2 className="text-body font-semibold text-pi-ink">Choose your sources</h2>
        <ul className="agent-setup-list mt-3">
          {PROVIDERS.map((provider) => {
            const c = setup.channels.find((c) => c.provider === provider);
            const on = c?.status === "connected";
            const scopes = SOURCE_SCOPES[provider];
            return (
              <li key={provider} className="collection-source-row">
                <ProviderIcon provider={provider} />
                <label
                  htmlFor={`source-${provider}`}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <span className="block text-small font-medium text-pi-ink">
                    {provider}
                  </span>
                  <span className="block text-caption text-pi-body">
                    {on ? c.account : providerCopy[provider]}
                  </span>
                </label>
                {on && provider !== "WhatsApp Business" && (
                  <NeoSelect
                    aria-label={
                      provider === "Gmail" ? "Gmail label" : "Drive folder"
                    }
                    className="collection-source-scope"
                    value={c.scope}
                    onChange={(scope) =>
                      setDraftChannel(company, { ...c, scope })
                    }
                    options={scopes.map((s) => ({ value: s, label: s }))}
                  />
                )}
                <Switch
                  id={`source-${provider}`}
                  checked={on}
                  onCheckedChange={(v) => toggle(provider, v)}
                />
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-caption text-pi-faint">
          Demo sources use sample documents. No real account is connected.
        </p>
      </section>

      <details className="agent-setup-disclosure mt-6">
        <summary>
          <span className="block text-small font-medium text-pi-ink">Collection settings</span>
          <span className="mt-1 block text-caption text-pi-body">
            {setup.files === "bills" ? "Supplier bills" : "All documents"} · {setup.senders === "known" ? "Known suppliers and staff" : "Anyone in these sources"} · {BACKFILL_LABEL[setup.backfill]} · {setup.schedule === "15m" ? "Every 15 minutes" : "Run manually"}
          </span>
        </summary>
        <div className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field label="Documents">
            <NeoSelect
              aria-label="Documents to collect"
              value={setup.files}
              onChange={(v) => change({ files: v as Setup["files"] })}
              options={[
                { value: "bills", label: "Supplier bills only" },
                { value: "all", label: "Bills, and hold the rest for review" },
              ]}
            />
          </Field>
          <Field label="From">
            <NeoSelect
              aria-label="Accept documents from"
              value={setup.senders}
              onChange={(v) => change({ senders: v as Setup["senders"] })}
              options={[
                { value: "known", label: "Known suppliers and staff" },
                { value: "anyone", label: "Anyone in these sources" },
              ]}
            />
          </Field>
          <Field label="Starting">
            <NeoSelect
              aria-label="Start collecting from"
              value={setup.backfill}
              onChange={(v) => change({ backfill: v as Setup["backfill"] })}
              options={Object.entries(BACKFILL_LABEL).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Field>
          <Field label="Check">
            <NeoSelect
              aria-label="Check for new documents"
              value={setup.schedule}
              onChange={(v) => change({ schedule: v as Setup["schedule"] })}
              options={[
                { value: "15m", label: "Every 15 minutes" },
                { value: "manual", label: "Only when I run it" },
              ]}
            />
          </Field>
        </div>
      </details>

      <section className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-body font-semibold text-pi-ink">
            Preview with sample documents
          </h2>
          {valid && (
            <span className="text-caption text-pi-body">
              {results.length} sample{" "}
              {results.length === 1 ? "document" : "documents"}
            </span>
          )}
        </div>
        {valid ? (
          <details className="agent-setup-disclosure mt-3">
            <summary>
              <span className="block text-small font-medium text-pi-ink">
                {results.filter((r) => r.outcome === "prepared").length} ready for Inbox · {results.filter((r) => r.outcome === "needs-decision").length} held for review
              </span>
              <span className="mt-1 block text-caption text-pi-body">View each document and why it is included or skipped</span>
            </summary>
          <ul className="agent-setup-list mt-3">
            {results.map((r, i) => (
              <li
                key={`${r.key}-${i}`}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-small font-medium text-pi-ink">
                    {r.file}
                  </p>
                  <p className="mt-0.5 text-caption text-pi-body">{r.reason}</p>
                </div>
                <span className="shrink-0 text-caption text-pi-body">
                  {OUTCOME[r.outcome] || "Needs a clearer copy"}
                </span>
              </li>
            ))}
            {!results.length && (
              <li className="px-4 py-3 text-small text-pi-body">
                No sample documents match. New documents will follow these
                settings.
              </li>
            )}
          </ul>
          </details>
        ) : (
          <p className="mt-3 text-small text-pi-body">
            Switch on a source to see what Neo would collect.
          </p>
        )}
        <p className="mt-3 text-caption text-pi-body">
          Bills arrive in Inbox as drafts. Nothing is approved, posted or sent
          without you.
        </p>
      </section>

      {error && (
        <p role="alert" className="mt-4 text-small text-destructive">
          {error}
        </p>
      )}
      <footer className="agent-setup-footer">
        <Button
          variant="outline"
          onClick={() => {
            discardCollectionDraft(company);
            onDone();
          }}
        >
          Cancel
        </Button>
        <Button disabled={!valid} onClick={save}>
          {existing ? "Save changes" : "Start collecting"}
        </Button>
      </footer>
    </div>
  );
}

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="min-w-0">
    <span className="mb-1 block text-caption font-medium text-pi-body">
      {label}
    </span>
    {children}
  </div>
);
