import React, { useEffect, useId, useRef, useState } from "react";
import { Check, Upload, X } from "@/components/icons";
import { cn } from "@/lib/utils";
import styles from "./file-drop-zone.module.css";

type Props = {
  title: string;
  description: string;
  accept: string;
  formats: string;
  maxMb?: number;
  maxFiles?: number;
  disabled?: boolean;
  disabledReason?: string;
  onFiles: (files: File[]) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  testId?: string;
  guideId?: string;
};

/** How long the stack takes to square up and tick before the files go on. */
const DROP_BEAT_MS = 420;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The extensions in `accept`, as tags: ".jpeg" folds into JPG. */
const tagsOf = (accept: string) =>
  Array.from(
    new Set(
      accept
        .split(",")
        .map((v) => v.trim().toLowerCase())
        .filter((v) => v.startsWith("."))
        .map((v) => (v === ".jpeg" ? "JPG" : v.slice(1).toUpperCase()))
    )
  );

const SPREADSHEETS = ["CSV", "XLS", "XLSX"];

/** What a browser reports for each extension mid-drag. CSV is in the Excel
    type as well, because Windows reports it that way. */
const MIME: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".json": ["application/json"],
  ".csv": ["text/csv", "application/vnd.ms-excel"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};

/**
  Three sheets tagged with what the zone takes, the front one carrying the
  upload badge: a tick on drop, a cross on a drag it will refuse. A zone
  that takes one file draws one sheet; a spreadsheet is drawn as cells,
  not lines of text.
*/
function DocStack({ tags, single }: { tags: string[]; single: boolean }) {
  // Front is the first format named, the others either side of it.
  const [front = "PDF", left = "", right = ""] = tags;
  const sheet = (pos: "left" | "right" | "front", tag: string) => {
    // A side sheet with no format of its own is another of the front's.
    const kind = tag || front;
    return (
      <span className={styles.sheet} data-pos={pos}>
        {SPREADSHEETS.includes(kind) ? (
          <span className={styles.cells}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} />
            ))}
          </span>
        ) : (
          <>
            <span className={styles.line} />
            <span className={styles.line} />
            <span className={styles.line} />
          </>
        )}
        {tag && <span className={styles.tag}>{tag}</span>}
        {pos === "front" && (
          <span className={styles.badge}>
            <Upload className={styles.arrow} />
            <Check className={styles.tick} />
            <X className={styles.cross} />
          </span>
        )}
      </span>
    );
  };
  return (
    <span aria-hidden className={styles.stage} data-single={single || undefined}>
      {!single && sheet("left", left)}
      {!single && sheet("right", right)}
      {sheet("front", front)}
    </span>
  );
}

/** Shared selection surface; extraction, mapping and transfer state stay with the module. */
export default function FileDropZone({
  title,
  description,
  accept,
  formats,
  maxMb,
  maxFiles = 1,
  disabled,
  disabledReason,
  onFiles,
  inputRef,
  testId,
  guideId,
}: Props) {
  const localInput = useRef<HTMLInputElement>(null);
  const input = inputRef ?? localInput;
  const id = useId();
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  // How many files are being dragged in, read off the drag itself.
  const [dragCount, setDragCount] = useState(0);
  // Why the files being dragged would be refused, said before the drop.
  const [refusal, setRefusal] = useState("");
  const tags = tagsOf(accept);
  const [dropped, setDropped] = useState(0);
  const beat = useRef<number>();
  useEffect(() => () => window.clearTimeout(beat.current), []);
  const take = (list: FileList | null) => {
    if (disabled || dropped || !list?.length) return;
    const files = Array.from(list);
    const extensions = accept
      .split(",")
      .filter((value) => value.startsWith("."));
    const invalid = files.find(
      (file) =>
        extensions.length &&
        !extensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext.toLowerCase())
        )
    );
    const empty = files.find((file) => file.size === 0);
    const large =
      maxMb && files.find((file) => file.size > maxMb * 1024 * 1024);
    const problem =
      files.length > maxFiles
        ? `Choose ${maxFiles === 1 ? "one file" : `up to ${maxFiles} files`} at a time. No files were added.`
        : invalid
          ? `${invalid.name} isn’t supported. Choose ${formats} files. No files were added.`
          : empty
            ? `${empty.name} is empty. Choose a file with content.`
            : large
              ? `${large.name} exceeds ${maxMb} MB. Choose a smaller file.`
              : "";
    setError(problem);
    if (problem) return;
    // The stack lands before the screen moves on to the upload; reduced
    // motion has nothing to wait for.
    if (reducedMotion()) return onFiles(files);
    setDropped(files.length);
    beat.current = window.setTimeout(() => {
      setDropped(0);
      onFiles(files);
    }, DROP_BEAT_MS);
  };
  const live = over && !disabled;
  const plural = (n: number) => `${n} file${n === 1 ? "" : "s"}`;
  const heading = dropped
    ? `Adding ${plural(dropped)}`
    : live
      ? refusal ||
        (dragCount
          ? maxFiles === 1
            ? "Drop to add the file"
            : `Drop ${plural(dragCount)}`
          : "Drop to add files")
      : title;
  /** Reads the drag: how many files, and whether any is a type not taken.
      A file whose type the browser leaves blank is given the benefit of the
      doubt; the drop still checks it by name. */
  const readDrag = (data: DataTransfer) => {
    const items = Array.from(data.items ?? []).filter((i) => i.kind === "file");
    setDragCount(items.length);
    const allowed = accept
      .split(",")
      .flatMap((v) => MIME[v.trim().toLowerCase()] ?? [v.trim()]);
    const wrongType = items.some((i) => i.type && !allowed.includes(i.type));
    setRefusal(
      items.length > maxFiles
        ? maxFiles === 1
          ? "One file at a time"
          : `Up to ${maxFiles} files at a time`
        : wrongType
          ? `Only ${tags.join(", ")} files`
          : ""
    );
  };
  const state = dropped
    ? "dropped"
    : live
      ? refusal
        ? "refused"
        : "over"
      : undefined;
  return (
    <div data-guide-id={guideId} className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        aria-describedby={`${id}-help ${id}-error`}
        onClick={() => input.current?.click()}
        data-state={state}
        onDragOver={(event) => {
          event.preventDefault();
          if (disabled) return;
          setOver(true);
          readDrag(event.dataTransfer);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setOver(false);
            setDragCount(0);
            setRefusal("");
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          setDragCount(0);
          setRefusal("");
          take(event.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-[190px] w-full flex-col items-center justify-center gap-3 rounded-md px-5 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
          styles.zone,
          state === "refused"
            ? "bg-pi-danger-bg"
            : state
              ? "bg-pi-brand-tint"
              : "bg-pi-head-bg enabled:hover:bg-pi-brand-tint"
        )}
      >
        <svg aria-hidden className={styles.edge}>
          <rect width="100%" height="100%" rx="8" />
        </svg>
        <DocStack tags={tags} single={maxFiles === 1} />
        <span
          key={heading}
          className={cn(
            "text-body font-medium",
            state === "refused" ? "text-pi-danger" : "text-pi-ink",
            styles.title
          )}
        >
          {heading}
        </span>
        <span className="text-caption text-pi-body">{description}</span>
        <span className="rounded-md border border-pi-line-2 bg-background px-3 py-2 text-body font-medium text-pi-brand">
          Browse files
        </span>
      </button>
      <input
        ref={input}
        type="file"
        hidden
        disabled={disabled}
        accept={accept}
        multiple={maxFiles > 1}
        aria-label="Choose upload files"
        data-testid={testId}
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />
      <p
        id={`${id}-help`}
        className="text-center text-caption leading-5 text-pi-faint"
      >
        {disabledReason && disabled
          ? disabledReason
          : `${formats}${maxMb ? ` · ${maxMb} MB per file` : ""} · ${maxFiles === 1 ? "One file at a time" : `Up to ${maxFiles} files`}`}
      </p>
      <p
        id={`${id}-error`}
        role="alert"
        className={cn("text-caption leading-5 text-pi-danger", !error && "hidden")}
      >
        {error}
      </p>
    </div>
  );
}
