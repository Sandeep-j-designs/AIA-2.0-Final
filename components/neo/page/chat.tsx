import React, { useEffect, useRef, useState } from "react";
import { KnowledgeSummary } from "./knowledge";
import { NeoStar, Payables, Reconcile, Mail } from "@/components/icons";
import { actor } from "@/components/inbox/v2/store";
import { useNeo } from "@/hooks/pages/neo/use-neo";
import { useComposer } from "@/hooks/pages/neo/use-composer";
import Shortcuts from "@/components/neo/common/shortcuts";
import Canvas from "@/components/neo/common/canvas";
import Composer from "@/components/neo/common/composer";
import ContextChip from "@/components/neo/common/context-chip";
import DropZone from "@/components/neo/common/drop-zone";
import Thread, { useLiveMessage } from "@/components/neo/common/thread";
import { NeoMenuButton } from "./index";

const NOTE = "Neo prepares drafts. You review and approve them before posting.";

/** "Good morning" before noon, "Good afternoon" to five, then evening. */
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/** A quiet starting point; conversation and document workflows stay in chat. */
const NeoChat = ({ company }: { company: string }) => {
  const neo = useNeo();
  const box = useComposer(neo);
  const live = useLiveMessage(neo);
  const input = useRef<HTMLTextAreaElement>(null);
  const empty = !neo.messages.length;
  const first = actor.split(" ")[0];
  const [hello, setHello] = useState("Hello");
  useEffect(() => setHello(greeting()), []);

  useEffect(() => {
    input.current?.focus();
  }, [neo.chatId]);

  // Digits answer the open question, Esc stops a run — as in the panel.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.defaultPrevented) return;
    const typing = (e.target as HTMLElement).closest(
      "input, textarea, select, [contenteditable=true]"
    );
    if (e.key === "Escape" && neo.busy) {
      e.preventDefault();
      neo.stop();
      return;
    }
    if (
      live?.ask &&
      !live.ask.input &&
      !typing &&
      !box.draft &&
      /^[1-9]$/.test(e.key)
    ) {
      const option = live.ask.options[Number(e.key) - 1];
      if (option) {
        e.preventDefault();
        neo.answer(live.id, option.id);
      }
    }
  };

  // Expanded from the panel: what the panel was looking at comes along.
  const ctx = neo.runContext || neo.context;
  const carried = !!(ctx.itemId || ctx.selectedIds.length);

  const composer = (
    <Composer
      ref={input}
      variant="page"
      value={box.draft}
      busy={!!neo.busy}
      attachments={box.attachments}
      onChange={box.setDraft}
      onSend={() => box.send()}
      onStop={neo.stop}
      onAttachFiles={box.attachFiles}
      onAttachSample={box.attachSample}
      onRemoveAttachment={box.removeAttachment}
      context={
        carried ? (
          <ContextChip
            variant="pill"
            context={ctx}
            onClear={neo.detach}
            locked={!!neo.runContext}
          />
        ) : undefined
      }
    />
  );

  return (
    <section
      aria-label="Neo chat"
      onKeyDown={onKeyDown}
      className="relative flex min-h-0 flex-1"
    >
      <DropZone
        onFiles={box.attachFiles}
        disabled={!!neo.busy}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
      >
        {/* The title lives in the top bar's trail; below 1024px this row
            only carries the button that opens Neo's column. */}
        <header className="relative flex h-12 flex-none items-center gap-1 px-2 lg:hidden">
          <NeoMenuButton />
        </header>

        {empty ? (
          <div className="neo-home-scroll relative min-h-0 flex-1 overflow-y-auto">
            <div className="neo-home-content">
              <div className="neo-home-intro">
                <NeoStar className="neo-home-mark" aria-hidden="true" />
                <p className="neo-home-greeting">
                  {hello}, {first}
                </p>
                <h1>Let’s get your books in order.</h1>
                <p className="neo-home-subtitle">
                  Ask a question, share a bill, or start with a task below.
                </p>
              </div>
              <div className="neo-home-composer">{composer}</div>
              <div className="neo-home-task-heading">
                <span>A good place to start</span>
              </div>
              <div
                className="neo-home-prompts"
                aria-label="Try an accounting task"
              >
                {[
                  {
                    label: "Review pending bills",
                    description: "See what needs your approval",
                    icon: Reconcile,
                    prompt: "Show my pending approvals",
                  },
                  {
                    label: "See overdue invoices",
                    description: "Find out who owes you money",
                    icon: Mail,
                    prompt: "Who owes us money?",
                  },
                  {
                    label: "Enter supplier bills",
                    description: "Turn documents into draft entries",
                    icon: Payables,
                    prompt: "Enter a batch of bills with an instruction",
                  },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => {
                      box.setDraft(item.prompt);
                      input.current?.focus();
                    }}
                  >
                    <item.icon className="size-5 text-pi-brand" />
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </button>
                ))}
              </div>
              <KnowledgeSummary key={company} company={company} />
              <p className="neo-home-note">{NOTE}</p>
            </div>
          </div>
        ) : (
          <>
            <Thread
              variant="page"
              onPrompt={(t) => box.send(t)}
              onOpenScope={(id) =>
                neo.goTo({ label: "", itemId: id, target: "open" })
              }
            />
            <div className="flex-none px-4 pb-3 pt-1 sm:px-6 sm:pb-4">
              <div className="mx-auto max-w-[760px]">
                {composer}
                {!neo.signedOff && (
                  <p className="mt-2 text-center text-caption text-pi-faint max-sm:hidden">
                    {NOTE}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </DropZone>
      <Canvas variant="page" />
      <Shortcuts />
    </section>
  );
};

export default NeoChat;
