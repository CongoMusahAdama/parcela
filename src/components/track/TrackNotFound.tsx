import Link from "next/link";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";

type TrackNotFoundProps = {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function TrackNotFound({
  title = "Parcel not found",
  message = "We couldn't find a parcel for this code or link. Check the details from the sender and try again.",
  backHref = "/track",
  backLabel = "Enter code again",
  actionHref,
  actionLabel,
}: TrackNotFoundProps) {
  return (
    <AppShell className="bg-background">
      <Link
        href="/"
        className="font-display mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
      >
        <ArrowLeft className="size-4" />
        Home
      </Link>

      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface px-6 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PackageSearch className="size-8" strokeWidth={1.75} />
        </div>
        <h1 className="font-display mt-5 text-2xl font-bold text-foreground">{title}</h1>
        <p className="font-body mt-2 max-w-sm text-sm leading-relaxed text-muted">{message}</p>
      </div>

      <div className="mt-6 space-y-2">
        <Button href={backHref} fullWidth>
          {backLabel}
        </Button>
        {actionHref && actionLabel ? (
          <Button href={actionHref} variant="outline" fullWidth>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </AppShell>
  );
}
