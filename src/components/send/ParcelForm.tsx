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

type ParcelFormProps = {
  originStation: Station;
  destinationStations: Station[];
  step: number;
  onStepChange: (step: number) => void;
  onSubmit: (data: ParcelFormData) => void;
  isSubmitting?: boolean;
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
  children: React.ReactNode;
};

function ReviewCard({ title, onEdit, children }: ReviewCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border/80 px-3.5 py-2.5">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">
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
      <div className="divide-y divide-border/60 px-3.5">{children}</div>
    </div>
  );
}

type FormStepNavProps = {
  step: number;
  maxReachedStep: number;
  onGoTo: (step: number) => void;
};

function FormStepNav({ step, maxReachedStep, onGoTo }: FormStepNavProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-background p-1 ring-1 ring-border/80">
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
              "font-display flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold transition-all",
              isActive && "bg-surface text-primary shadow-sm ring-1 ring-border/60",
              !isActive && canVisit && "text-foreground hover:bg-surface/80",
              !canVisit && "cursor-not-allowed text-muted/50"
            )}
          >
            <Icon
              className={cn("size-3.5", isActive ? "text-primary" : isDone ? "text-primary" : "")}
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
    { destinationStations, step, onStepChange, onSubmit, isSubmitting },
    ref
  ) {
    const [form, setForm] = useState<ParcelFormData>({
      senderName: "",
      senderPhone: "",
      recipientName: "",
      recipientPhone: "",
      destinationStationId: destinationStations[0]?.id ?? "",
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
      <form id="parcel-form" onSubmit={handleSubmit} className="space-y-4">
        <FormStepNav step={step} maxReachedStep={maxReachedStep} onGoTo={goToStep} />

        <div className="rounded-2xl border border-border bg-surface px-4 py-3.5">
          <p className="font-display text-[10px] font-bold uppercase tracking-wider text-primary">
            Part {step + 1} of {SUB_STEPS.length}
          </p>
          <h2 className="font-display mt-0.5 text-base font-bold text-foreground">{meta.title}</h2>
          <p className="font-body text-sm text-muted">{meta.subtitle}</p>
        </div>

        {step === 0 && (
          <section className="space-y-3.5 rounded-2xl border border-border bg-surface p-4">
            <div>
              <Label htmlFor="senderName">Full name</Label>
              <Input
                id="senderName"
                placeholder="Your full name"
                value={form.senderName}
                onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                autoComplete="name"
              />
              {errors.senderName && (
                <p className="font-body mt-1 text-xs text-danger">{errors.senderName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="senderPhone">Phone number</Label>
              <Input
                id="senderPhone"
                type="tel"
                placeholder="e.g. 024 123 4567"
                value={form.senderPhone}
                onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
                autoComplete="tel"
              />
              {errors.senderPhone && (
                <p className="font-body mt-1 text-xs text-danger">{errors.senderPhone}</p>
              )}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-3.5 rounded-2xl border border-border bg-surface p-4">
            <div>
              <Label htmlFor="recipientName">Full name</Label>
              <Input
                id="recipientName"
                placeholder="Recipient full name"
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                autoComplete="name"
              />
              {errors.recipientName && (
                <p className="font-body mt-1 text-xs text-danger">{errors.recipientName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="recipientPhone">Phone number</Label>
              <Input
                id="recipientPhone"
                type="tel"
                placeholder="e.g. 055 987 6543"
                value={form.recipientPhone}
                onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
                autoComplete="tel"
              />
              {errors.recipientPhone && (
                <p className="font-body mt-1 text-xs text-danger">{errors.recipientPhone}</p>
              )}
            </div>
            <DestinationStationPicker
              stations={destinationStations}
              value={form.destinationStationId}
              onChange={(destinationStationId) =>
                setForm({ ...form, destinationStationId })
              }
              error={errors.destinationStationId}
            />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-3.5">
            <p className="font-body px-1 text-xs text-muted">
              One booking, one tracking ID — add all parcels you are dropping off together.
            </p>
            {form.items.map((item, index) => (
              <div
                key={index}
                className="space-y-3.5 rounded-2xl border border-border bg-surface p-4"
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
                  <div className="grid grid-cols-2 gap-2">
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
          <section className="space-y-3">
            <ReviewCard title="Sender" onEdit={() => goToStep(0)}>
              <ReviewRow label="Name" value={form.senderName || "—"} />
              <ReviewRow label="Phone" value={form.senderPhone || "—"} />
            </ReviewCard>

            <ReviewCard title="Recipient" onEdit={() => goToStep(1)}>
              <ReviewRow label="Name" value={form.recipientName || "—"} />
              <ReviewRow label="Phone" value={form.recipientPhone || "—"} />
              <ReviewRow
                label="Destination"
                value={destination ? `${destination.name}, ${destination.city}` : "—"}
              />
            </ReviewCard>

            <ReviewCard title={`Items (${form.items.length})`} onEdit={() => goToStep(2)}>
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
