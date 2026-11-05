import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import NeoSelect from "@/components/neo/common/neo-select";
import type { AccountingAgent } from "@/config/pages/neo/agent-catalogue";
export type AgentPlan = {
  owner: string;
  cadence: string;
  escalation: string;
  notes: string;
};

const CADENCES = [
  "When new data arrives",
  "Every weekday",
  "Weekly",
  "At month-end",
];

/**
 * An agent's plan on one screen (4 Nov 2026; was Scope → Preferences →
 * Review). The owner is you and the cadence and escalation start on sensible
 * defaults, so most setups are one click; exceptions fold away until needed.
 */
export default function PlanSetup({
  agent,
  plan,
  saved,
  onChange,
  onSave,
  onCancel,
}: {
  agent: AccountingAgent;
  plan: AgentPlan;
  saved: boolean;
  onChange: (patch: Partial<AgentPlan>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [exceptions, setExceptions] = useState(!!plan.notes);
  const days = Number(plan.escalation);
  const valid = plan.owner.trim() !== "" && days >= 1 && days <= 90;
  return (
    <form
      className="agent-setup"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave();
      }}
    >
      <section>
        <h2 className="text-body font-semibold text-pi-ink">How it works</h2>
        <div className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="mb-1 block text-caption font-medium text-pi-body">
              Check
            </span>
            <NeoSelect
              aria-label="Review cadence"
              value={plan.cadence}
              onChange={(cadence) => onChange({ cadence })}
              options={CADENCES.map((c) => ({ value: c, label: c }))}
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-caption font-medium text-pi-body">
              Exceptions go to
            </span>
            <Input
              aria-label="Responsible owner"
              value={plan.owner}
              onChange={(e) => onChange({ owner: e.target.value })}
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-caption font-medium text-pi-body">
              Escalate unresolved items after
            </span>
            <span className="relative block">
              <Input
                aria-label="Escalate after (days)"
                type="number"
                min={1}
                max={90}
                value={plan.escalation}
                onChange={(e) => onChange({ escalation: e.target.value })}
                className="pr-12"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-small text-pi-faint">
                days
              </span>
            </span>
          </label>
        </div>
        {exceptions ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-caption font-medium text-pi-body">
              Leave out
            </span>
            <Textarea
              rows={2}
              autoFocus={!plan.notes}
              value={plan.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="For example: only domestic suppliers; exclude disputed invoices"
            />
          </label>
        ) : (
          <Button
            type="button"
            variant="tertiary"
            className="-ml-3 mt-3"
            onClick={() => setExceptions(true)}
          >
            Leave something out
          </Button>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-body font-semibold text-pi-ink">What it uses</h2>
        <p className="mt-2 text-small leading-6 text-pi-body">
          {agent.sources.join(" · ")}
        </p>
        <p className="mt-2 text-small leading-6 text-pi-body">
          {agent.permissions}
        </p>
      </section>

      <footer className="agent-setup-footer">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid}>
          {saved ? "Save changes" : "Turn on"}
        </Button>
      </footer>
    </form>
  );
}
