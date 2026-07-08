import { Suspense } from "react";
import { LeadTeamView } from "@/components/lead/LeadTeamView";

export default function LeadTeamPage() {
  return (
    <Suspense fallback={<div className="px-4 py-8 text-sm text-muted">Loading…</div>}>
      <LeadTeamView />
    </Suspense>
  );
}
