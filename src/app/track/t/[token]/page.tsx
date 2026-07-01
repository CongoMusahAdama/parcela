"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { lookupParcelByTokenAsync } from "@/lib/tracking";
import type { TrackedParcel } from "@/types/parcel";

function TrackLinkRedirect() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const [parcel, setParcel] = useState<TrackedParcel | null | undefined>(undefined);

  useEffect(() => {
    if (!token) {
      setParcel(null);
      return;
    }
    lookupParcelByTokenAsync(token).then((result) => setParcel(result ?? null));
  }, [token]);

  useEffect(() => {
    if (!parcel) return;
    router.replace(`/track/status?code=${encodeURIComponent(parcel.pickupCode)}`);
  }, [parcel, router]);

  if (parcel === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="font-body text-sm text-muted">Opening your parcel...</p>
      </div>
    );
  }

  if (!parcel) {
    router.replace("/track?error=invalid-link");
    return null;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <p className="font-body text-sm text-muted">Redirecting to parcel status...</p>
    </div>
  );
}

export default function TrackLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <p className="font-body text-sm text-muted">Loading...</p>
        </div>
      }
    >
      <TrackLinkRedirect />
    </Suspense>
  );
}
