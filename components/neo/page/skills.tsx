import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Payables,
  Reconcile,
  Mail,
  X,
  BookOpen,
  Search,
  Pencil,
} from "@/components/icons";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { SKILLS, type NeoSkill } from "@/config/pages/neo/skills";
import { cn } from "@/lib/utils";

const BUTTON =
  "inline-flex h-9 items-center justify-center gap-2 rounded-sm px-3 text-small font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand disabled:cursor-not-allowed disabled:opacity-40";
const ICONS = {
  bills: Payables,
  recon: Reconcile,
  chase: Mail,
  journal: BookOpen,
  collections: Mail,
  receivables: Search,
  reclassify: Pencil,
  expenses: Search,
  "tax-credit": Reconcile,
};

/** Discovery and procedure details only. Run results stay in chat and workspaces. */
export default function NeoSkills({ company }: { company: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<NeoSkill | null>(null);
  useEffect(() => {
    setSelected(
      SKILLS.find((skill) => skill.id === router.query.skill) || null
    );
  }, [router.query.skill]);
  const detailTrigger = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="neo-skills-scroll min-h-0 flex-1 overflow-y-auto">
      <div className="neo-skills-content neo-skills-compact">
        <header className="neo-library-header">
          <div>
            <h1>Skills</h1>
            <p>
              Neo uses these when you ask in chat or attach documents. Type / in
              the prompt box to start one yourself. They work the same in every
              organisation.
            </p>
          </div>
        </header>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-caption text-pi-body">
          <span>{SKILLS.length} accounting procedures</span>
          <span>Used automatically when relevant</span>
        </div>
        <ul className="neo-compact-procedures">
          {SKILLS.map((skill) => {
            const Icon = ICONS[skill.id as keyof typeof ICONS] || Payables;
            return (
              <li key={skill.id} className="neo-skill-card">
                <div className="neo-skill-card-body">
                  <div className="flex items-center gap-3">
                    <span className="neo-skill-icon">
                      <Icon className="size-5" />
                    </span>
                    <h3>{skill.name}</h3>
                    <code className="ml-auto">/{skill.slash}</code>
                  </div>
                  <p className="neo-skill-description">{skill.does}</p>
                  <div className="neo-skill-actions">
                    <button
                      type="button"
                      data-skill-procedure={skill.id}
                      aria-label={`View ${skill.name} procedure`}
                      onClick={(event) => {
                        detailTrigger.current = event.currentTarget;
                        setSelected(skill);
                      }}
                      className={cn(BUTTON, "text-pi-body hover:bg-pi-fill")}
                    >
                      View procedure <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            (
              detailTrigger.current ||
              document.querySelector<HTMLButtonElement>(
                "[data-skill-procedure]"
              )
            )?.focus();
          }}
          side="right"
          className="flex h-[100dvh] w-full flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-[540px]"
        >
          {selected && (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-pi-line p-6">
                <div>
                  <p className="mb-2 text-caption font-medium text-pi-faint">
                    PROCEDURE · VERSION {selected.version}
                  </p>
                  <SheetTitle className="text-h3 text-pi-ink">
                    {selected.name}
                  </SheetTitle>
                  <SheetDescription className="mt-2 text-small leading-6 text-pi-body">
                    {selected.does}
                  </SheetDescription>
                </div>
                <SheetClose
                  aria-label="Close skill details"
                  className={cn(
                    BUTTON,
                    "size-8 shrink-0 p-0 text-pi-body hover:bg-pi-fill"
                  )}
                >
                  <X className="size-4" />
                </SheetClose>
              </div>
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 text-small leading-6 text-pi-body">
                <section>
                  <h3 className="mb-2 font-semibold text-pi-ink">
                    When Neo uses it
                  </h3>
                  <p>{selected.when}</p>
                  <p className="mt-2 rounded-md bg-pi-fill px-3 py-2">
                    “{selected.requestExample}”
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-pi-ink">
                    What Neo needs
                  </h3>
                  <ul className="list-disc space-y-1 pl-4">
                    {selected.inputs.map((input) => (
                      <li key={input}>{input}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-pi-ink">
                    How Neo works
                  </h3>
                  <ol className="list-decimal space-y-2 pl-4">
                    {selected.procedure.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-pi-ink">
                    Company policy
                  </h3>
                  <p>{selected.policy}</p>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-pi-ink">
                    When something is missing
                  </h3>
                  <p>{selected.exceptions}</p>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-pi-ink">
                    What you get
                  </h3>
                  <p>{selected.output}</p>
                  <p className="mt-2">{selected.completion}</p>
                </section>
                <section className="rounded-md border border-pi-line bg-pi-fill p-4">
                  <h3 className="mb-1 font-semibold text-pi-ink">
                    Your review
                  </h3>
                  <p>{selected.approval}</p>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-pi-ink">
                    When it runs
                  </h3>
                  <p>
                    Neo uses this procedure when it matches your request or
                    documents. You can also name the skill in chat.
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-pi-ink">
                    Prototype scope
                  </h3>
                  <p>{selected.example}</p>
                </section>
              </div>
              <div className="flex-none border-t border-pi-line px-6 py-5">
                <p className="text-caption leading-5 text-pi-body">
                  Ask Neo in chat. There is no separate setup or launch step for
                  this skill.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
