import { getState } from "@/components/inbox/v2/store";
import type { NeoTask } from "@/types/pages/neo";
import { money } from "@/utils/pages/neo";
import { inPeriod, parsePeriod } from "@/utils/pages/neo/period";
import {
  isExplanation,
  topicFor,
  isConversationFollowUp,
} from "../conversation";
import { refTo } from "./shared";

const analytics =
  /financial (snapshot|summary|overview)|business (summary|overview)|how (are we|is the business) doing|revenue|sales (summary|total)|show .*sales|which bills need review|total (sales|purchases|spend|expenses)|purchase summary|expense (summary|breakdown)|spend breakdown|pending approvals|needs (my )?approval|waiting for approval|review queue|duplicate bills|duplicate invoices|any duplicates/i;
const limits =
  /cash balance|bank balance|runway|forecast|profit margin|net profit|balance sheet|ebitda|payroll report|file.*return|submit.*return|pay.*supplier|make.*payment/i;
const social =
  /^(hi|hello|hey|good morning|good evening|thanks|thank you|thank you neo|help|what can you do|who are you)( neo)?[!.? ]*$/i;

/** Broader natural-language surface around the existing approval-based workflows. */
const conversation: NeoTask = {
  id: "conversation",
  title: "Ask Neo",
  match: (p, _ctx, files) => {
    if (files?.length) return 0;
    if (isConversationFollowUp(p) || social.test(p) || limits.test(p))
      return 60;
    if (isExplanation(p) && topicFor(p)) return 60;
    if (analytics.test(p)) return 25;
    return 0.1;
  },
  run: async (api) => {
    const p = api.prompt.trim();
    const s = getState();
    const company = api.context.company || s.company;
    const name =
      s.companies.find((c) => c.id === company)?.name || "this company";
    const history = api.history || [];
    const previous = [...history]
      .reverse()
      .find((m) => m.role === "neo" && m.text);
    const lastQuestion = [...history]
      .reverse()
      .find(
        (m) =>
          m.role === "user" &&
          m.text &&
          !isConversationFollowUp(m.text) &&
          !/^(and|what about|how about|same for|i meant)\b/i.test(m.text)
      );
    const topic = topicFor(p);
    const priorTopic =
      lastQuestion?.text && isExplanation(lastQuestion.text)
        ? topicFor(lastQuestion.text)
        : undefined;
    if (isConversationFollowUp(p)) {
      if (!previous?.text) {
        await api.say(
          "Of course. What would you like me to explain or summarise? You can ask about an accounting concept or a figure in your books."
        );
        api.suggest([
          "Give me a financial snapshot",
          "Explain accrual accounting",
        ]);
      } else if (/sources|numbers/i.test(p)) {
        await api.say(
          priorTopic
            ? "That was an accounting example. The amounts are only examples, not your company’s transactions."
            : "I used this company’s records in the demo. Open the linked documents to check the figures. Invoice totals do not show cash balances or full profit and loss.",
          previous.links
        );
      } else if (priorTopic) {
        await api.say(
          /example/i.test(p)
            ? `**Example only**\n\n${priorTopic.example}`
            : /table/i.test(p)
              ? `| Idea | Explanation |\n| --- | --- |\n| ${priorTopic.title} | ${priorTopic.answer.replace(/\n/g, " ")} |\n| Example | ${priorTopic.example} |`
              : `**${priorTopic.title}, simply:**\n\n${priorTopic.answer}`
        );
        api.suggest([priorTopic.next, "Give me a financial snapshot"]);
      } else {
        const paragraphs = previous.text.split(/\n\n/).filter(Boolean);
        await api.say(
          /example/i.test(p)
            ? "For example, an approved sales invoice can contribute to invoiced revenue while its receipt is still outstanding. To understand the cash position, we would also need bank balances and payment allocations."
            : /table/i.test(p)
              ? `| Previous answer | Detail |\n| --- | --- |\n${paragraphs
                  .slice(0, 6)
                  .map(
                    (v, i) =>
                      `| ${i + 1} | ${v.replace(/\|/g, " / ").replace(/\n/g, " ")} |`
                  )
                  .join("\n")}`
              : `Here’s the short version:\n\n${paragraphs.slice(0, 2).join("\n\n")}`,
          previous.links
        );
        api.suggest(["Show the sources", "Show my pending approvals"]);
      }
      return "Follow-up answered";
    }
    if (social.test(p)) {
      await api.say(
        /thank/i.test(p)
          ? "You’re welcome. We can keep exploring these numbers or move to the next task."
          : `Hi, I’m Neo. I can check **${name}**’s records, answer accounting questions and prepare draft entries.\n\nTry “Show September sales” or “Which bills need review?”. I’ll tell you if I need more details.`
      );
      api.suggest([
        "Give me a financial snapshot",
        "Give me a month-end close checklist",
        "Explain accrual accounting",
      ]);
      return "Ready to help";
    }
    if (topic && isExplanation(p)) {
      await api.say(
        `**${topic.title}**\n\n${topic.answer}\n\n**Example**\n${topic.example}`
      );
      api.suggest(["Make it simpler", "Put that in a table", topic.next]);
      return topic.title;
    }
    if (limits.test(p)) {
      await api.say(
        `I need more information to do that for **${name}**.\n\n${/cash|bank balance|runway|forecast/i.test(p) ? "I need opening bank balances, all bank transactions and expected payments and receipts. Invoices alone cannot show your cash balance." : /profit|ebitda|balance sheet/i.test(p) ? "I need the trial balance, opening balances and all adjustments to calculate this. Sales minus purchase bills is not net profit." : "This demo can prepare drafts for review. It cannot make bank payments or file tax returns."}\n\nI can show the invoices available here or help you plan the next steps.`
      );
      api.suggest([
        "Give me a financial snapshot",
        "Who owes us money?",
        "Give me a month-end close checklist",
      ]);
      return "Data or connection needed";
    }
    if (analytics.test(p)) {
      const period = parsePeriod(p);
      if (/\b(20\d{2})\b/.test(p) && !period) {
        await api.say(
          "Which month or financial year should I use? Try “September 2026” or “this FY”."
        );
        return "Period needed";
      }
      const rows = s.items.filter(
        (x) =>
          x.company === company &&
          !x.priorVoucher &&
          inPeriod(x.form.date, period)
      );
      const approved = rows.filter((x) => x.status === "Approved");
      const sales = approved.filter((x) => x.route === "AR");
      const purchases = approved.filter((x) => x.route === "AP");
      const pending = rows.filter(
        (x) => x.status === "Needs Review" || x.status === "Duplicate"
      );
      const duplicates = rows.filter((x) => x.status === "Duplicate");
      const sum = (xs: typeof rows) =>
        xs.reduce(
          (n, x) => n + x.form.lines.reduce((v, l) => v + l.amount, 0),
          0
        );
      const when = period ? period.label : "all dates in this company";
      const step = await api.step(`Reading ${name} · ${when}`);
      await api.wait(300);
      step(`${rows.length} documents checked`);
      let source = rows;
      let title = "Financial snapshot";
      let text = "";
      if (/compare|versus|\bvs\b/i.test(p)) {
        const months =
          p.match(
            /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi
          ) || [];
        const periods = months
          .map((m) => parsePeriod(`${m} ${p.match(/\b20\d{2}\b/)?.[0] || ""}`))
          .filter((v): v is NonNullable<typeof v> => !!v);
        if (periods.length !== 2) {
          await api.say(
            "Which two months should I compare? For example: “Compare revenue in August and September”."
          );
          api.suggest([
            "Compare revenue in August and September",
            "Compare purchases in August and September",
          ]);
          return "Comparison periods needed";
        }
        const route = /purchase|spend|expense/i.test(p) ? "AP" : "AR";
        const sets = periods.map((period) =>
          s.items.filter(
            (x) =>
              x.company === company &&
              !x.priorVoucher &&
              x.status === "Approved" &&
              x.route === route &&
              inPeriod(x.form.date, period)
          )
        );
        const amounts = sets.map(sum);
        const delta = amounts[1] - amounts[0];
        await api.say(
          `**${route === "AP" ? "Approved purchases" : "Approved sales before tax"} · ${name}**\n\n| Period | Before tax | Documents |\n| --- | ---: | ---: |\n${periods.map((v, i) => `| ${v.label} | ${money(amounts[i])} | ${sets[i].length} |`).join("\n")}\n\n${sets.some((xs) => !xs.length) ? "I found no records for one month. Check for missing invoices before comparing the percentage change." : `The second period is ${money(Math.abs(delta))} ${delta >= 0 ? "higher" : "lower"}${amounts[0] ? ` (${((Math.abs(delta) / amounts[0]) * 100).toFixed(1)}%)` : ""}.`} This compares invoices in the demo, not complete financial statements.`,
          sets
            .flat()
            .slice(0, 5)
            .map((x) => refTo(x))
        );
        api.suggest([
          "Show the sources",
          "Make it shorter",
          "Show my pending approvals",
        ]);
        return "Periods compared";
      }
      if (/pending|approval|review queue|bills need review/i.test(p)) {
        source = pending;
        title = "Pending approvals";
        text = `**${pending.length} documents need review** for ${name}, ${when}. Total value is **${money(pending.reduce((n, x) => n + x.amount, 0))}**, including tax.\n\nCheck the documents, ledgers and any issues before approval. ${duplicates.length} may be duplicates. Check the copies before rejecting them.`;
      } else if (/duplicate/i.test(p)) {
        source = duplicates;
        title = "Possible duplicate bills";
        text = `**${duplicates.length} possible duplicate${duplicates.length === 1 ? "" : "s"}** for ${name}, ${when}.\n\nCompare supplier, invoice number, date, amount, and any previous posting before rejecting a document. No records have been changed.`;
      } else if (/revenue|sales/i.test(p)) {
        source = sales;
        title = "Invoiced revenue";
        text = `**${money(sum(sales))} in approved sales invoices**, before tax, for ${name}, ${when}.\n\nThis covers ${sales.length} approved sales invoices in this prototype. This is the invoice total, not money received. Drafts and bills waiting for review are not included. It is not a full revenue report.`;
      } else if (/purchase|expense|spend/i.test(p)) {
        source = purchases;
        title = "Approved purchase activity";
        const ledgers = new Map<string, number>();
        purchases.forEach((x) =>
          x.form.lines.forEach((l) =>
            ledgers.set(
              l.ledger || "Unassigned",
              (ledgers.get(l.ledger || "Unassigned") || 0) + l.amount
            )
          )
        );
        text = `**${money(sum(purchases))} in approved purchase bills**, before tax, for ${name}, ${when}.\n\n| Ledger | Amount |\n| --- | ---: |\n${[
          ...ledgers,
        ]
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `| ${k.replace(/\|/g, "/")} | ${money(v)} |`)
          .join(
            "\n"
          )}\n\nThis is the purchase bill total, not total business expenses. It may not include journals, salaries or other adjustments.`;
      } else {
        source = [...sales, ...purchases, ...pending];
        text = `Here’s the available picture for **${name} · ${when}**.\n\n| Measure | Amount / count |\n| --- | ---: |\n| Approved sales, before tax | ${sales.length ? money(sum(sales)) : "No approved records"} |\n| Approved purchases, before tax | ${purchases.length ? money(sum(purchases)) : "No approved records"} |\n| Documents awaiting review | ${pending.length} |\n| Possible duplicates | ${duplicates.length} |\n\nThese totals use invoices in this demo. They do not show full profit or cash balances. Review pending bills to keep your books up to date.`;
      }
      if (!source.length)
        text = `**No matching ${title.toLowerCase()} records** for ${name}, ${when}.\n\nI could not find matching records in this demo. This does not mean there was no activity. Try another period or check for missing documents.`;
      await api.say(
        text,
        source.slice(0, 5).map((x) => refTo(x))
      );
      if (source.length && title !== "Financial snapshot")
        api.show(
          {
            kind: "list",
            title: `${title} · ${when}`,
            groups: [
              {
                label: `${source.length} source documents`,
                tone: "neutral",
                rows: source.map((x) => ({
                  itemId: x.id,
                  primary: x.form.party || x.id,
                  secondary: `${x.form.invoiceNo || x.id} · ${x.form.date} · ${x.status}`,
                  amount:
                    /pending|approval|review queue|bills need review|duplicate/i.test(
                      p
                    )
                      ? x.amount
                      : x.form.lines.reduce((n, l) => n + l.amount, 0),
                })),
              },
            ],
          },
          { open: false }
        );
      api.suggest([
        "Show the sources",
        "Show my pending approvals",
        "Show revenue for September",
      ]);
      return title;
    }
    if (
      /^(and|what about|how about|same for|only|just|i meant)\b/i.test(p) &&
      lastQuestion?.text &&
      analytics.test(lastQuestion.text)
    ) {
      const period = parsePeriod(p);
      if (period) {
        const previousPeriod = parsePeriod(lastQuestion.text);
        const base = previousPeriod
          ? lastQuestion.text.replace(
              new RegExp(previousPeriod.phrase, "i"),
              ""
            )
          : lastQuestion.text;
        await api.chain(`${base} in ${period.label}`);
        return "Updated period";
      }
    }
    if (
      /^(show|analyse|analyze|check|review) (it|that|this|the numbers|my accounts)[.!?]*$/i.test(
        p
      )
    ) {
      await api.say(
        "What would you like to check: sales, purchases or bills waiting for review?"
      );
      api.suggest([
        "Show revenue for September",
        "Show expense breakdown",
        "Show my pending approvals",
      ]);
      return "Scope needed";
    }
    await api.say(
      `What would you like me to check? Please name the task and the month, if needed.\n\nFor example, “Show revenue for September”, “Explain prepayments”, or “Enter a batch of bills”. I use ${name}’s demo records and prepared accounting explanations. This demo does not use a live AI model or search the web.`
    );
    api.suggest([
      "Give me a financial snapshot",
      "Give me a month-end close checklist",
      "What can you do?",
    ]);
    return "Clarification offered";
  },
};
export default conversation;
