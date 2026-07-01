"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Loader2 } from "lucide-react";
import { requestSendLocation } from "@/lib/sendLocation";
import { cn } from "@/lib/utils";

type SendParcelActionProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
};

export function SendParcelAction({
  title,
  description,
  icon: Icon,
  className,
}: SendParcelActionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (loading) return;
    setLoading(true);
    await requestSendLocation();
    router.push("/send");
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={loading}
      className={cn(
        "group touch-manipulation flex min-h-[56px] w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-200 active:scale-[0.985] disabled:opacity-90",
        "bg-primary text-white shadow-[0_4px_16px_rgb(13_148_136/0.28)]",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-white/15">
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Icon className="size-5" strokeWidth={2.25} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold leading-tight">
          {loading ? "Getting your location..." : title}
        </p>
        {!loading ? (
          <p className="font-body mt-0.5 text-xs leading-snug text-white/80">{description}</p>
        ) : null}
      </div>

      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-primary">
        <ArrowRight className="size-4" strokeWidth={2.5} />
      </span>
    </button>
  );
}
