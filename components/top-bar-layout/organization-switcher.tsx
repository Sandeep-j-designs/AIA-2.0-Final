import React, { useRef, useState } from "react";
import { ChevronsUpDown, Plus, Pencil, X } from "@/components/icons";
import type { UserCompany } from "@/types/pages/organisation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import CreateUpdateOrganisationModal from "@/components/organisation/create-update-organisation/create-update-organisation-modal";

type Props = {
  companies: UserCompany[];
  selectedCompanyUuid?: string;
  onSelect: (companyUuid: string) => void;
  onCreate: (companyName: string) => string;
  onRename: (companyUuid: string, companyName: string) => void;
  className?: string;
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

export default function OrganisationSwitcher({
  companies,
  selectedCompanyUuid,
  onSelect,
  onCreate,
  onRename,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<UserCompany | "new" | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = companies.find(
    (company) => company.companyUuid === selectedCompanyUuid
  );
  const name = selected?.companyName || "Select organisation";
  const ordered = companies
    .filter((company) => company.companyUuid !== selectedCompanyUuid)
    .sort((a, b) => a.companyName.localeCompare(b.companyName));
  const editCompany = editing && editing !== "new" ? editing : null;
  const launchEditor = (company: UserCompany | "new") => {
    setEditing(company);
    setOpen(false);
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          setSearch("");
        }}
      >
        <SheetTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label={`Organisation: ${name}. Switch organisation`}
            title={name}
            className={cn(
              "group flex h-control min-w-0 items-center gap-2 rounded-sm border border-transparent bg-pi-fill px-2 text-left transition-colors hover:bg-pi-fill-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand focus-visible:ring-offset-2 data-[state=open]:border-pi-brand-border data-[state=open]:bg-pi-brand-tint",
              className
            )}
          >
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-xs bg-pi-brand-tint text-caption font-semibold text-pi-brand"
            >
              {initials(name)}
            </span>
            <span className="hidden min-w-0 flex-1 truncate text-small font-medium text-pi-ink sm:block">
              {name}
            </span>
            <ChevronsUpDown
              aria-hidden="true"
              className="size-3.5 shrink-0 text-pi-faint"
            />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          aria-label="Switch organisation"
          className="flex h-[100dvh] w-full max-w-[420px] flex-col gap-0 overflow-hidden border-pi-line-2 bg-background p-0 sm:max-w-[420px]"
          onCloseAutoFocus={(event) => {
            if (editing) event.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-pi-line p-6">
            <div>
              <SheetTitle className="text-h3 text-pi-ink">
                Switch organisation
              </SheetTitle>
              <SheetDescription className="mt-1 text-small text-pi-body">
                Your work is scoped to the selected organisation.
              </SheetDescription>
            </div>
            <SheetClose
              aria-label="Close organisation drawer"
              className="grid size-8 shrink-0 place-items-center rounded-sm text-pi-body hover:bg-pi-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand"
            >
              <X className="size-4" />
            </SheetClose>
          </div>
          {selected && (
            <section
              aria-label="Current organisation"
              className="mx-6 mt-5 flex-none rounded-md border border-pi-brand-border bg-pi-brand-tint p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-overline font-semibold uppercase text-pi-brand">
                  Current organisation
                </h2>
                <button
                  type="button"
                  onClick={() => launchEditor(selected)}
                  aria-label="Rename current organisation"
                  title="Rename organisation"
                  className="grid size-7 place-items-center rounded-sm text-pi-body hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-sm border border-pi-brand-border bg-background text-caption font-semibold text-pi-brand"
                >
                  {initials(selected.companyName)}
                </span>
                <h3 className="min-w-0 break-words text-lead font-semibold leading-6 text-pi-ink">
                  {selected.companyName}
                </h3>
              </div>
              <dl className="mt-3 space-y-2 border-t border-pi-brand-border pt-3 text-caption">
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                  <dt className="text-pi-body">Primary GSTIN</dt>
                  <dd className="font-mono font-medium text-pi-ink">
                    {selected.gstin || "Not added"}
                  </dd>
                </div>
                {selected.registrationState && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-pi-body">Registration state</dt>
                    <dd className="text-pi-ink">
                      {selected.registrationState}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-pi-body">Accounting software</dt>
                  <dd className="text-pi-ink">
                    {selected.thirdPartyTool === "tally"
                      ? "Tally"
                      : selected.thirdPartyTool === "zoho"
                        ? "Zoho Books"
                        : selected.thirdPartyTool || "Not connected"}
                  </dd>
                </div>
              </dl>
            </section>
          )}
          <Command className="min-h-0 flex-1 bg-background pt-5">
            <CommandInput
              aria-label="Search organisations"
              placeholder="Search by name or GSTIN"
              value={search}
              onValueChange={setSearch}
              wrapperClassName="mx-6 mb-4 rounded-md border border-pi-line-2 bg-background px-3 focus-within:border-pi-brand"
              className="h-10 rounded-none border-0 bg-transparent p-0 text-small shadow-none focus:ring-0"
            />
            <CommandList className="max-h-none flex-1 overflow-y-auto px-3 pb-4">
              <CommandEmpty className="px-4 py-6 text-center text-small text-pi-body">
                {ordered.length
                  ? "No other organisations match. Try a name or GSTIN."
                  : "No other organisations yet."}
              </CommandEmpty>
              <CommandGroup
                heading={`Switch to another organisation (${ordered.length})`}
                className="p-0 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:text-pi-faint"
              >
                {ordered.map((company) => {
                  return (
                    <CommandItem
                      key={company.companyUuid}
                      value={company.companyUuid}
                      keywords={[
                        company.companyName,
                        company.gstin || "",
                        company.registrationState || "",
                      ]}
                      onSelect={() => {
                        onSelect(company.companyUuid);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="my-1 cursor-pointer items-start gap-3 rounded-md border border-transparent px-3 py-3 text-pi-ink data-[selected=true]:border-pi-line data-[selected=true]:bg-pi-row-hover"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-8 shrink-0 place-items-center rounded-sm bg-pi-fill text-caption font-semibold text-pi-body"
                      >
                        {initials(company.companyName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block whitespace-normal break-words text-small font-medium leading-5">
                          {company.companyName}
                        </span>
                        <span className="mt-1 block text-caption text-pi-body">
                          GSTIN{" "}
                          <span className="font-mono">
                            {company.gstin || "not added"}
                          </span>
                        </span>
                        {company.registrationState && (
                          <span className="mt-0.5 block text-caption text-pi-faint">
                            {company.registrationState}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="space-y-0.5 border-t border-pi-line bg-background px-3 py-4">
            <button
              type="button"
              onClick={() => launchEditor("new")}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-small font-medium text-pi-brand hover:bg-pi-brand-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand"
            >
              <Plus className="size-4" />
              Create organisation
            </button>
          </div>
        </SheetContent>
      </Sheet>
      {editing && (
        <CreateUpdateOrganisationModal
          isOpen
          setIsOpen={(value) => {
            if (!value) {
              setEditing(null);
              triggerRef.current?.focus();
            }
          }}
          company={editCompany}
          existingNames={companies
            .filter(
              (company) => company.companyUuid !== editCompany?.companyUuid
            )
            .map((company) => company.companyName)}
          onSave={(companyName) => {
            if (editCompany) {
              onRename(editCompany.companyUuid, companyName);
              return editCompany.companyUuid;
            }
            return onCreate(companyName);
          }}
        />
      )}
    </>
  );
}
