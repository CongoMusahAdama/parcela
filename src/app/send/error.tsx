"use client";

import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";

export default function SendError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <h1 className="font-display text-xl font-bold text-foreground">Something went wrong</h1>
      <p className="font-body mt-2 text-sm text-muted">
        The station finder could not load. Try again or return home.
      </p>
      <div className="mt-6 space-y-3">
        <Button type="button" onClick={reset} fullWidth>
          Try again
        </Button>
        <Button href="/" variant="outline" fullWidth>
          Back to home
        </Button>
      </div>
    </AppShell>
  );
}
