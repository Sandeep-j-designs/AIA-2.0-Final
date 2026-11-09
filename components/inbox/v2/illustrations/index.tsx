import { cn } from "@/lib/utils";
import s from "./illustrations.module.css";

/**
 * Inbox illustrations (9 Nov 2026) — one-shot vignettes for milestones and
 * explained failures. Inline SVG + CSS only: Motion and Lottie are not in the
 * production app, and these have to transplant.
 *
 * Every scene plays once on mount and its resting state is the finished
 * picture, so `still` (or reduced motion) shows the final frame. To replay,
 * remount with a new `key`.
 */

type SceneProps = { still?: boolean; className?: string };

const Scene = ({
  still,
  className,
  label,
  children,
}: SceneProps & { label: string; children: React.ReactNode }) => (
  <svg
    viewBox="0 0 240 150"
    role="img"
    aria-label={label}
    className={cn(s.scene, still && s.still, className)}
  >
    {children}
  </svg>
);

/** A sheet of paper with a few text lines. */
const Sheet = ({
  x,
  y,
  w,
  h,
  lines = 4,
  paperClass = s.paper,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lines?: number;
  paperClass?: string;
}) => {
  const pad = Math.round(w * 0.14);
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={4} className={paperClass} />
      {Array.from({ length: lines }, (_, i) => (
        <line
          key={i}
          x1={x + pad}
          x2={x + w - pad - (i === lines - 1 ? w * 0.28 : 0)}
          y1={y + pad + 4 + i * 10}
          y2={y + pad + 4 + i * 10}
          className={i === 0 ? s.lineStrong : s.line}
        />
      ))}
    </>
  );
};

/* ------------------------------------------------------------------------ */
/* 1. Review queue cleared                                                   */
/* ------------------------------------------------------------------------ */

export const ReviewClearIllustration = (props: SceneProps) => (
  <Scene {...props} label="Every document reviewed">
    <ellipse cx={120} cy={132} rx={72} ry={5} className={s.shadow} />
    <rect x={56} y={96} width={128} height={30} rx={5} className={s.tray} />
    <g className={s.rcSheet1}>
      <Sheet x={78} y={26} w={84} h={96} lines={0} />
    </g>
    <g className={s.rcSheet2}>
      <Sheet x={78} y={22} w={84} h={96} lines={0} />
    </g>
    <g className={s.rcSheet3}>
      <Sheet x={78} y={18} w={84} h={96} lines={5} />
    </g>
    <rect x={56} y={108} width={128} height={18} rx={4} className={s.trayLip} />
    <circle cx={160} cy={66} r={22} className={s.rcSpread} />
    <g className={s.rcStamp}>
      <circle cx={160} cy={66} r={20} className={s.rcStampDisc} />
      <circle cx={160} cy={66} r={16} className={s.rcStampRing} />
      <path d="M152 66.5l5.5 5.5L169 60.5" className={s.rcStampCheck} />
    </g>
  </Scene>
);

/* ------------------------------------------------------------------------ */
/* 2. Sync to ERP — success, partial, failure                                */
/* ------------------------------------------------------------------------ */

export type SyncOutcome = "success" | "partial" | "failure";

const TRAY_SHEETS = [40, 37, 34, 31]; // bottom → top
const TRAVEL_MS = 760;
const STAGGER_MS = 160;

const Erp = ({ className }: { className?: string }) => (
  <g className={className}>
    <rect x={164} y={30} width={64} height={84} rx={6} className={s.syErp} />
    <text x={196} y={50} textAnchor="middle" className={s.syErpLabel}>
      ERP
    </text>
    {[64, 74, 84, 94].map((y, i) => (
      <line
        key={y}
        x1={176}
        x2={i === 3 ? 202 : 216}
        y1={y}
        y2={y}
        className={s.syErpLine}
      />
    ))}
  </g>
);

const Tray = ({ children }: { children: React.ReactNode }) => (
  <>
    <rect x={12} y={92} width={78} height={30} rx={5} className={s.tray} />
    {children}
    <rect x={12} y={104} width={78} height={18} rx={4} className={s.trayLip} />
  </>
);

const Badge = ({
  cx,
  cy,
  tone,
  delay,
}: {
  cx: number;
  cy: number;
  tone: "success" | "warning" | "danger";
  delay: number;
}) => {
  const disc = {
    success: s.badgeSuccess,
    warning: s.badgeWarning,
    danger: s.badgeDanger,
  }[tone];
  const ink = {
    success: s.inkSuccess,
    warning: s.inkWarning,
    danger: s.inkDanger,
  }[tone];
  return (
    <g className={s.popIn} style={{ animationDelay: `${delay}ms` }}>
      <circle cx={cx} cy={cy} r={10} className={disc} />
      {tone === "success" ? (
        <path
          d={`M${cx - 4.5} ${cy + 0.5}l3 3 6-6.5`}
          className={cn(s.check, s.drawCheck, ink)}
          style={{ animationDelay: `${delay + 120}ms` }}
        />
      ) : tone === "warning" ? (
        <path
          d={`M${cx} ${cy - 4.5}v5M${cx} ${cy + 4}v.01`}
          className={cn(s.check, ink)}
        />
      ) : (
        <path
          d={`M${cx - 3.5} ${cy - 3.5}l7 7M${cx + 3.5} ${cy - 3.5}l-7 7`}
          className={cn(s.check, ink)}
        />
      )}
    </g>
  );
};

export const SyncOutcomeIllustration = ({
  outcome,
  ...props
}: SceneProps & { outcome: SyncOutcome }) => {
  const label = {
    success: "Every approved document reached ERP",
    partial: "One document didn't reach ERP and is back in the tray",
    failure: "The connection to ERP is broken; nothing was sent",
  }[outcome];

  if (outcome === "failure") {
    return (
      <Scene {...props} label={label}>
        <ellipse cx={120} cy={132} rx={108} ry={5} className={s.shadow} />
        <Tray>
          {TRAY_SHEETS.map((y, i) => (
            <g key={y} className={i === TRAY_SHEETS.length - 1 ? s.syNudge : undefined}>
              <Sheet x={24} y={y} w={54} h={68} lines={i === TRAY_SHEETS.length - 1 ? 4 : 0} />
            </g>
          ))}
        </Tray>
        <g className={s.syPlugLeft}>
          <path d="M96 70h16" className={s.syCable} />
          <rect x={112} y={64} width={11} height={12} rx={2} className={s.syPlug} />
          <path d="M123 67h4M123 73h4" className={s.syCable} />
        </g>
        <g className={s.syPlugRight}>
          <rect x={134} y={64} width={11} height={12} rx={2} className={s.syPlug} />
          <path d="M145 70h13" className={s.syCable} />
        </g>
        <Erp className={s.syErpDim} />
        <Badge cx={130.5} cy={50} tone="danger" delay={620} />
      </Scene>
    );
  }

  const held = outcome === "partial";
  const travellers = held ? TRAY_SHEETS.slice(1) : TRAY_SHEETS;
  // Top sheet leaves first.
  const order = [...travellers].reverse();
  const lastArrival = (order.length - 1) * STAGGER_MS + TRAVEL_MS;
  const heldDelay = order.length * STAGGER_MS;
  const heldDone = heldDelay + 900;

  return (
    <Scene {...props} label={label}>
      <ellipse cx={120} cy={132} rx={108} ry={5} className={s.shadow} />
      <line x1={96} x2={158} y1={70} y2={70} className={s.syRoute} />
      <Erp className={s.syErpPulse} />
      <Tray>
        {held ? (
          <g className={s.syHeld} style={{ animationDelay: `${heldDelay}ms` }}>
            <Sheet
              x={24}
              y={TRAY_SHEETS[0]}
              w={54}
              h={68}
              lines={4}
              paperClass={s.syHeldPaper}
            />
          </g>
        ) : null}
        {order.map((y, i) => (
          <g
            key={y}
            className={s.syTravel}
            style={{ animationDelay: `${i * STAGGER_MS}ms` }}
          >
            <Sheet x={24} y={y} w={54} h={68} lines={i === 0 ? 4 : 0} />
          </g>
        ))}
      </Tray>
      {held ? (
        <Badge cx={76} cy={TRAY_SHEETS[0] + 2} tone="warning" delay={heldDone} />
      ) : (
        <Badge cx={226} cy={32} tone="success" delay={lastArrival} />
      )}
    </Scene>
  );
};

/* ------------------------------------------------------------------------ */
/* 6. Extraction failed — password, damaged, unreadable                      */
/* ------------------------------------------------------------------------ */

export type ExtractionFailure = "password" | "damaged" | "unreadable";

const PAGE = { x: 82, y: 14, w: 76, h: 116 };
const pageLines = (count = 7, shortTop = false) =>
  Array.from({ length: count }, (_, i) => {
    const y = PAGE.y + 20 + i * 11;
    const end =
      shortTop && i < 2
        ? PAGE.x + 46
        : PAGE.x + PAGE.w - 10 - (i % 3 === 2 ? 18 : 0);
    return (
      <line
        key={i}
        x1={PAGE.x + 10}
        x2={end}
        y1={y}
        y2={y}
        className={i === 0 ? s.lineStrong : s.line}
      />
    );
  });

export const ExtractionFailedIllustration = ({
  cause,
  ...props
}: SceneProps & { cause: ExtractionFailure }) => {
  if (cause === "password") {
    return (
      <Scene {...props} label="The document is locked with a password">
        <ellipse cx={120} cy={134} rx={48} ry={4} className={s.shadow} />
        <rect {...pageRect} className={s.paper} />
        <g className={s.exDim}>{pageLines()}</g>
        <g className={s.exLock}>
          <path d="M110 77v-8a10 10 0 0 1 20 0v8" className={s.exShackle} />
          <rect x={103} y={75} width={34} height={27} rx={5} className={s.exLockBody} />
          <circle cx={120} cy={86} r={3.2} className={s.exLockHole} />
          <rect x={118.8} y={87} width={2.4} height={7} rx={1.2} className={s.exLockHole} />
        </g>
      </Scene>
    );
  }

  if (cause === "damaged") {
    return (
      <Scene {...props} label="The file is damaged; a corner has torn away">
        <ellipse cx={120} cy={134} rx={48} ry={4} className={s.shadow} />
        <polygon
          points="82,14 132,14 136,22 142,19 146,28 152,26 158,34 158,130 82,130"
          className={s.paper}
        />
        {pageLines(7, true)}
        <polyline
          points="132,14 136,22 142,19 146,28 152,26 158,34"
          className={s.exTearEdge}
        />
        <g className={s.exCorner}>
          <polygon
            points="132,14 158,14 158,34 152,26 146,28 142,19 136,22"
            className={s.paper}
          />
          <line x1={138} x2={150} y1={18} y2={18} className={s.line} />
        </g>
      </Scene>
    );
  }

  return (
    <Scene {...props} label="The document is too blurred to read">
      <ellipse cx={120} cy={134} rx={48} ry={4} className={s.shadow} />
      <rect {...pageRect} className={s.paper} />
      <g className={s.exBlur}>{pageLines()}</g>
      <g className={s.exLens}>
        <line x1={140} y1={88} x2={152} y2={100} className={s.exLensHandle} />
        <circle cx={128} cy={76} r={17} className={s.exLensGlass} />
        <text x={128} y={82} textAnchor="middle" className={s.exQuestion}>
          ?
        </text>
      </g>
    </Scene>
  );
};

const pageRect = {
  x: PAGE.x,
  y: PAGE.y,
  width: PAGE.w,
  height: PAGE.h,
  rx: 4,
};
