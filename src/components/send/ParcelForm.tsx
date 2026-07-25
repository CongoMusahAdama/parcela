"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import {
  Box,
  ClipboardCheck,
  FileText,
  Mail,
  Package,
  Pencil,
  User,
  Users,
} from "lucide-react";
import { DestinationStationPicker } from "@/components/send/DestinationStationPicker";
import type { ParcelType, Station, BookingItem } from "@/types/parcel";
import { parcelTypeLabel } from "@/lib/bookingItems";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export type BookingItemDraft = {
  parcelType: ParcelType;
  description: string;
  fragile: boolean;
};

export type ParcelFormData = {
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  destinationStationId: string;
  items: BookingItemDraft[];
};

export type ParcelFormHandle = {
  step: number;
  back: () => void;
  next: () => boolean;
  goToStep: (step: number) => void;
};

/** "compact" fits the mobile sender flow; "comfortable" gives desktop portals more room. */
export type ParcelFormDensity = "compact" | "comfortable";

type ParcelFormProps = {
  originStation: Station;
  destinationStations: Station[];
  step: number;
  onStepChange: (step: number) => void;
  onSubmit: (data: ParcelFormData) => void;
  isSubmitting?: boolean;
  density?: ParcelFormDensity;
};

const PARCEL_TYPES: {
  value: ParcelType;
  label: string;
  icon: typeof Box;
}[] = [
  { value: "envelope", label: "Envelope", icon: Mail },
  { value: "document", label: "Documents", icon: FileText },
  { value: "box", label: "Box", icon: Box },
  { value: "other", label: "Other", icon: Package },
];

const SUB_STEPS = [
  { id: 0, title: "Sender", short: "Sender", icon: User },
  { id: 1, title: "Recipient", short: "Recipient", icon: Users },
  { id: 2, title: "Parcel", short: "Parcel", icon: Package },
  { id: 3, title: "Review", short: "Review", icon: ClipboardCheck },
] as const;

const STEP_META = [
  { title: "Sender details", subtitle: "Who is dropping off the parcel?" },
  { title: "Recipient details", subtitle: "Who will collect the parcel?" },
  { title: "Parcel info", subtitle: "Add every item you're sending in this trip" },
  { title: "Review & confirm", subtitle: "Check everything looks right" },
] as const;

function emptyItem(): BookingItemDraft {
  return { parcelType: "box", description: "", fragile: false };
}

function validateStep(
  step: number,
  form: ParcelFormData
): Partial<Record<string, string>> {
  const next: Partial<Record<string, string>> = {};

  if (step === 0) {
    if (!form.senderName.trim()) next.senderName = "Required";
    if (!form.senderPhone.trim()) next.senderPhone = "Required";
    else if (!/^\+?[\d\s-]{9,}$/.test(form.senderPhone.trim()))
      next.senderPhone = "Enter a valid phone number";
  }

  if (step === 1) {
    if (!form.recipientName.trim()) next.recipientName = "Required";
    if (!form.recipientPhone.trim()) next.recipientPhone = "Required";
    else if (!/^\+?[\d\s-]{9,}$/.test(form.recipientPhone.trim()))
      next.recipientPhone = "Enter a valid phone number";
    if (!form.destinationStationId) next.destinationStationId = "Select destination";
  }

  if (step === 2) {
    if (form.items.length === 0) next.items = "Add at least one item";
    form.items.forEach((item, i) => {
      if (!item.description.trim()) next[`item-${i}-description`] = "Required";
    });
  }

  return next;
}

type ReviewRowProps = {
  label: string;
  value: string;
};

function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="font-body shrink-0 text-xs text-muted">{label}</span>
      <span className="font-body text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

type ReviewCardProps = {
  title: string;
  onEdit: () => void;
  roomy?: boolean;
  children: React.ReactNode;
};

function ReviewCard({ title, onEdit, roomy, children }: ReviewCardProps) {
  return (
    <div className={cn("border border-border bg-surface", roomy ? "rounded-2xl" : "rounded-xl")}>
      <div
        className={cn(
          "flex items-center justify-between border-b border-border/80",
          roomy ? "px-5 py-3.5" : "px-3.5 py-2.5"
        )}
      >
        <p
          className={cn(
            "font-display font-semibold uppercase tracking-wide text-muted",
            roomy ? "text-[11px] tracking-wider" : "text-xs"
          )}
        >
          {title}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="font-display inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <Pencil className="size-3" />
          Edit
        </button>
      </div>
      <div className={cn("divide-y divide-border/60", roomy ? "px-5 py-1" : "px-3.5")}>
        {children}
      </div>
    </div>
  );
}

type FormStepNavProps = {
  step: number;
  maxReachedStep: number;
  onGoTo: (step: number) => void;
  roomy?: boolean;
};

function FormStepNav({ step, maxReachedStep, onGoTo, roomy }: FormStepNavProps) {
  return (
    <div
      className={cn(
        "flex rounded-xl bg-background ring-1 ring-border/80",
        roomy ? "gap-1.5 rounded-2xl p-1.5" : "gap-1 p-1"
      )}
    >
      {SUB_STEPS.map((s) => {
        const isActive = step === s.id;
        const isDone = s.id < step;
        const canVisit = s.id <= maxReachedStep;
        const Icon = s.icon;

        return (
          <button
            key={s.id}
            type="button"
            disabled={!canVisit}
            onClick={() => canVisit && onGoTo(s.id)}
            className={cn(
              "font-display flex flex-1 items-center justify-center font-semibold transition-all",
              roomy
                ? "gap-2 rounded-xl px-3 py-3 text-sm"
                : "flex-col gap-0.5 rounded-lg px-1 py-1.5 text-[10px]",
              isActive && "bg-surface text-primary shadow-sm ring-1 ring-border/60",
              !isActive && canVisit && "text-foreground hover:bg-surface/80",
              !canVisit && "cursor-not-allowed text-muted/50"
            )}
          >
            <Icon
              className={cn(
                roomy ? "size-4" : "size-3.5",
                isActive ? "text-primary" : isDone ? "text-primary" : ""
              )}
              strokeWidth={2}
            />
            {s.short}
          </button>
        );
      })}
    </div>
  );
}

export const ParcelForm = forwardRef<ParcelFormHandle, ParcelFormProps>(
  function ParcelForm(
    {
      originStation,
      destinationStations,
      step,
      onStepChange,
      onSubmit,
      isSubmitting,
      density = "compact",
    },
    ref
  ) {
    const roomy = density === "comfortable";
    const sectionClass = roomy
      ? "rounded-2xl border border-border bg-surface p-5 sm:p-6"
      : "rounded-xl border border-border bg-surface p-3.5";
    const fieldGridClass = roomy ? "grid gap-5 sm:grid-cols-2" : "space-y-3";
    const labelClass = roomy ? "mb-2 text-sm" : "mb-1 text-xs";
    const inputClass = roomy ? "!min-h-12 !rounded-xl" : "!min-h-11 !rounded-xl";
    const [form, setForm] = useState<ParcelFormData>({
      senderName: "",
      senderPhone: "",
      recipientName: "",
      recipientPhone: "",
      destinationStationId: "",
      items: [emptyItem()],
    });
    const [maxReachedStep, setMaxReachedStep] = useState(0);
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

    const meta = STEP_META[step] ?? STEP_META[0];
    const destination = destinationStations.find((s) => s.id === form.destinationStationId);

    function goToStep(target: number) {
      if (target < 0 || target > maxReachedStep) return;
      setErrors({});
      onStepChange(target);
    }

    useImperativeHandle(ref, () => ({
      step,
      back: () => goToStep(step - 1),
      goToStep,
      next: () => {
        if (step === SUB_STEPS.length - 1) return true;

        const stepErrors = validateStep(step, form);
        setErrors(stepErrors);
        if (Object.keys(stepErrors).length > 0) return false;

        const nextStep = step + 1;
        setMaxReachedStep((prev) => Math.max(prev, nextStep));
        onStepChange(nextStep);
        return true;
      },
    }));

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (step < SUB_STEPS.length - 1) return;

      const allErrors = {
        ...validateStep(0, form),
        ...validateStep(1, form),
        ...validateStep(2, form),
      };
      setErrors(allErrors);
      if (Object.keys(allErrors).length === 0 && !isSubmitting) onSubmit(form);
    }

    return (
      <form
        id="parcel-form"
        onSubmit={handleSubmit}
        className={roomy ? "space-y-5" : "space-y-3"}
      >
        <FormStepNav
          step={step}
          maxReachedStep={maxReachedStep}
          onGoTo={goToStep}
          roomy={roomy}
        />

        <p
          className={cn(
            "font-body leading-snug text-muted",
            roomy ? "px-0.5 text-sm" : "px-0.5 text-[12px]"
          )}
        >
          {meta.subtitle}
        </p>

        {step === 0 && (
          <section className={cn(sectionClass, roomy ? undefined : "space-y-3")}>
            <div className={fieldGridClass}>
              <div>
                <Label htmlFor="senderName" className={labelClass}>
                  Full name
                </Label>
                <Input
                  id="senderName"
                  placeholder="Your full name"
                  value={form.senderName}
                  onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                  autoComplete="name"
                  className={inputClass}
                />
                {errors.senderName && (
                  <p className="font-body mt-1 text-xs text-danger">{errors.senderName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="senderPhone" className={labelClass}>
                  Phone number
                </Label>
                <Input
                  id="senderPhone"
                  type="tel"
                  placeholder="e.g. 024 123 4567"
                  value={form.senderPhone}
                  onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
                  autoComplete="tel"
                  className={inputClass}
                />
                {errors.senderPhone && (
                  <p className="font-body mt-1 text-xs text-danger">{errors.senderPhone}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className={roomy ? "space-y-5" : "space-y-3"}>
            <div className={cn(sectionClass, roomy ? undefined : "space-y-3")}>
              <div className={fieldGridClass}>
                <div>
                  <Label htmlFor="recipientName" className={labelClass}>
                    Full name
                  </Label>
                  <Input
                    id="recipientName"
                    placeholder="Recipient full name"
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    autoComplete="name"
                    className={inputClass}
                  />
                  {errors.recipientName && (
                    <p className="font-body mt-1 text-xs text-danger">{errors.recipientName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="recipientPhone" className={labelClass}>
                    Phone number
                  </Label>
                  <Input
                    id="recipientPhone"
                    type="tel"
                    placeholder="e.g. 055 987 6543"
                    value={form.recipientPhone}
                    onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
                    autoComplete="tel"
                    className={inputClass}
                  />
                  {errors.recipientPhone && (
                    <p className="font-body mt-1 text-xs text-danger">{errors.recipientPhone}</p>
                  )}
                </div>
              </div>
            </div>
            <DestinationStationPicker
              stations={destinationStations}
              transportOperator={originStation.operator}
              originCity={originStation.city}
              value={form.destinationStationId}
              onChange={(destinationStationId) =>
                setForm({ ...form, destinationStationId })
              }
              error={errors.destinationStationId}
            />
          </section>
        )}

        {step === 2 && (
          <section className={roomy ? "space-y-5" : "space-y-3"}>
            <p className={cn("font-body px-0.5 text-muted", roomy ? "text-xs" : "text-[11px]")}>
              One booking, one tracking ID — add all parcels in this trip.
            </p>
            {form.items.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-2xl border border-border bg-surface",
                  roomy ? "space-y-5 p-5 sm:p-6" : "space-y-3.5 p-4"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-sm font-bold text-foreground">
                    Item {index + 1}
                  </p>
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          items: form.items.filter((_, i) => i !== index),
                        })
                      }
                      className="font-display text-xs font-semibold text-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Input
                    id={`description-${index}`}
                    placeholder="What's inside this item?"
                    value={item.description}
                    onChange={(e) => {
                      const items = [...form.items];
                      items[index] = { ...items[index], description: e.target.value };
                      setForm({ ...form, items });
                    }}
                  />
                  {errors[`item-${index}-description`] && (
                    <p className="font-body mt-1 text-xs text-danger">
                      {errors[`item-${index}-description`]}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Parcel type</Label>
                  <div className={cn("grid gap-2", roomy ? "grid-cols-4" : "grid-cols-2")}>
                    {PARCEL_TYPES.map((type) => {
                      const Icon = type.icon;
                      const selected = item.parcelType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            const items = [...form.items];
                            items[index] = { ...items[index], parcelType: type.value };
                            setForm({ ...form, items });
                          }}
                          className={cn(
                            "flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 transition-all",
                            selected
                              ? "border-primary bg-primary/10 text-primary-dark ring-1 ring-primary/20"
                              : "border-border bg-background text-muted hover:border-primary/25"
                          )}
                        >
                          <Icon className="size-5" strokeWidth={1.75} />
                          <span className="font-display text-xs font-semibold">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition-colors has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                  <input
                    type="checkbox"
                    checked={item.fragile}
                    onChange={(e) => {
                      const items = [...form.items];
                      items[index] = { ...items[index], fragile: e.target.checked };
                      setForm({ ...form, items });
                    }}
                    className="size-5 rounded border-border text-primary accent-primary"
                  />
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">
                      Fragile / special handling
                    </p>
                  </div>
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}
              className="font-display w-full rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-semibold text-primary"
            >
              + Add another item
            </button>
          </section>
        )}

        {step === 3 && (
          <section className={roomy ? "space-y-4" : "space-y-3"}>
            <ReviewCard title="Sender" onEdit={() => goToStep(0)} roomy={roomy}>
              <ReviewRow label="Name" value={form.senderName || "—"} />
              <ReviewRow label="Phone" value={form.senderPhone || "—"} />
            </ReviewCard>

            <ReviewCard title="Recipient" onEdit={() => goToStep(1)} roomy={roomy}>
              <ReviewRow label="Name" value={form.recipientName || "—"} />
              <ReviewRow label="Phone" value={form.recipientPhone || "—"} />
              <ReviewRow
                label="Destination"
                value={destination ? `${destination.name}, ${destination.city}` : "—"}
              />
            </ReviewCard>

            <ReviewCard
              title={`Items (${form.items.length})`}
              onEdit={() => goToStep(2)}
              roomy={roomy}
            >
              {form.items.map((item, index) => (
                <ReviewRow
                  key={index}
                  label={`Item ${index + 1}`}
                  value={`${parcelTypeLabel(item.parcelType)} — ${item.description || "—"}${item.fragile ? " · Fragile" : ""}`}
                />
              ))}
            </ReviewCard>

            <p className="font-body px-1 text-center text-xs text-muted">
              Tap <span className="font-medium text-foreground">Edit</span> on any section to change
              your details
            </p>
          </section>
        )}

        <button type="submit" className="sr-only" disabled={isSubmitting}>
          Submit
        </button>
      </form>
    );
  }
);
