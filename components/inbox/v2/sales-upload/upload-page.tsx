import FileDropZone from "../file-drop-zone";
import React, { useEffect, useState } from "react";
import { ArrowRight, Download, FileSpreadsheet, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ComboBox } from "@/components/common/combo-box";
import {
  AR_IMPORT_ACCEPT_VALUE,
  AR_IMPORT_MAX_UPLOAD_SIZE_BYTES,
  AR_IMPORT_SAMPLE_TEMPLATES,
} from "@/config/pages/inbox/sales-upload";
import { sampleCsv } from "@/config/pages/inbox/mock-sales-upload";
import {
  salesUpload,
  useImportTemplates,
  useSalesBatch,
} from "@/hooks/pages/inbox/use-sales-upload";
import { ARVoucherImportBatchStatus } from "@/types/pages/inbox/sales-upload";
import {
  formatFileSize,
  getArImportFileType,
} from "@/utils/pages/inbox/sales-upload";
import { Field, T } from "../ui";
import { FlowHeader } from "./common";

/** One spreadsheet and an optional saved mapping, followed by column mapping. */
type Props = {
  company: string;
  onMapping: (batchId: string) => void;
  onExit: () => void;
  notify: (
    message: string,
    kind?: "success" | "error" | "warning" | "info"
  ) => void;
};

const UploadPage = ({ company, onMapping, onExit, notify }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [templateUuid, setTemplateUuid] = useState("");
  const [pendingId, setPendingId] = useState("");
  const templates = useImportTemplates();
  const pending = useSalesBatch(pendingId);
  const submitting = !!pendingId;

  // Production polls the new batch until the file is read, then moves on.
  useEffect(() => {
    if (!pending) return;
    if (pending.batch.status === ARVoucherImportBatchStatus.PROCESSING) return;
    if (pending.batch.status === ARVoucherImportBatchStatus.FAILED) {
      setPendingId("");
      notify(
        pending.batch.failureMessage ?? "Failed to upload invoice.",
        "error"
      );
      return;
    }
    onMapping(pending.batch.importBatchUuid);
  }, [pending?.batch.status]);

  const take = (list: FileList | File[] | null) => {
    if (!list?.length) return;
    if (list.length > 1) {
      notify("Only one file can be uploaded at a time.", "error");
      return;
    }
    const next = list[0];
    if (!getArImportFileType(next.name)) {
      notify("Only .xls, .xlsx and .csv files are supported.", "error");
      return;
    }
    if (next.size > AR_IMPORT_MAX_UPLOAD_SIZE_BYTES) {
      notify("This file is larger than 30MB.", "error");
      return;
    }
    setFile(next);
  };

  const onContinue = () => {
    if (!file) {
      notify("Select a file before continuing.", "error");
      return;
    }
    const template = templates.find((t) => t.templateUuid === templateUuid);
    setPendingId(
      salesUpload.createBatch(
        company,
        { name: file.name, size: file.size },
        template ?? null
      )
    );
  };

  /*
    Production links each button to /api/downloads/by-key. There is no file
    store here, so the button writes the first rows of the demo register as a
    CSV in the browser — a real download of the expected column structure.
  */
  const download = (key: (typeof AR_IMPORT_SAMPLE_TEMPLATES)[number]) => {
    const item = key.downloadKey === "arItemInvoiceTemplate";
    const blob = new Blob([sampleCsv(item ? "item" : "accounting")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item
      ? "ar-item-invoice-template.csv"
      : "ar-accounting-invoice-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify(`${key.label} template downloaded.`);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-pi-page">
      <FlowHeader title="Upload Sales" onClose={onExit} step={0} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col px-page pb-10">
          {/* The card spans the header's width so it sits under the title
              and stepper; the content is one centred column inside it. */}
          <div className="rounded-md border border-pi-line bg-background px-6 py-8 shadow-table sm:py-10">
            <div className="mx-auto flex w-full max-w-[620px] flex-col gap-5">
              {/* The whole zone is the target: drop on it, or click to browse.
                With a file in, a click replaces it and × clears it. */}
              <FileDropZone
                title={
                  file ? "Replace sales spreadsheet" : "Add sales spreadsheet"
                }
                description="You’ll match the columns before importing invoices."
                accept={AR_IMPORT_ACCEPT_VALUE}
                formats="CSV, XLS, XLSX"
                maxMb={30}
                disabled={submitting}
                onFiles={take}
                testId="sales-upload-input"
              />
              {file && (
                <div className="flex min-w-0 items-center gap-2 rounded-md border border-pi-line p-3">
                  <FileSpreadsheet className="size-5 shrink-0 text-pi-brand" />
                  <span className="min-w-0 flex-1 break-all text-body">
                    {file.name}
                    <span className="ml-2 text-caption text-pi-faint">
                      {formatFileSize(file.size)}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove selected file"
                    disabled={submitting}
                    onClick={() => setFile(null)}
                  >
                    <X />
                  </Button>
                </div>
              )}

              {templates.length > 0 && (
                <Field label="Use a saved mapping" optional>
                  <ComboBox
                    title="Select a saved template"
                    options={templates.map((t) => ({
                      label: t.name,
                      value: t.templateUuid,
                    }))}
                    selectedValue={templateUuid}
                    onChange={(value) =>
                      setTemplateUuid(Array.isArray(value) ? value[0] : value)
                    }
                    isMultiSelect={false}
                    hasSearch={false}
                    disabled={submitting}
                    // ComboBox's trigger has no role="combobox", so the
                    // .modern-field rule misses it: the form box by hand.
                    triggerClassName="h-[38px] px-3 text-body"
                  />
                  <p className={T.sub}>
                    Prefills the columns if this file matches one you&apos;ve
                    mapped before.
                  </p>
                </Field>
              )}

              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-pi-line pt-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small leading-5">
                  <span className="text-pi-faint">Need a sample?</span>
                  {AR_IMPORT_SAMPLE_TEMPLATES.map((template) => (
                    <button
                      key={template.downloadKey}
                      type="button"
                      onClick={() => download(template)}
                      className="inline-flex items-center gap-1 rounded-xs text-pi-body transition-colors hover:text-pi-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                    >
                      <Download className="size-3.5" aria-hidden />
                      {template.label}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={onContinue}
                  disabled={!file}
                  loading={submitting}
                >
                  {submitting ? "Preparing upload..." : "Continue to mapping"}
                  <ArrowRight aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
