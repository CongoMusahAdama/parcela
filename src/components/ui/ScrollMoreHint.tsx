"use client";

import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { cn } from "@/lib/utils";

type ScrollMoreHintProps = {
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  hintLabel?: string;
};

export function ScrollMoreHint({
  children,
  className,
  scrollClassName,
  hintLabel = "Scroll for more",
}: ScrollMoreHintProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);

  const updateHint = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const canScroll = el.scrollHeight > el.clientHeight + 8;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    setShowHint(canScroll && !atBottom);
  }, []);

  useEffect(() => {
    updateHint();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateHint);
    observer.observe(el);

    return () => observer.disconnect();
  }, [children, updateHint]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    const canScroll = el.scrollHeight > el.clientHeight + 8;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    setShowHint(canScroll && !atBottom);
  }

  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          "mobile-scroll h-full min-h-0",
          showHint && "pb-10",
          scrollClassName
        )}
      >
        {children}
      </div>

      {showHint ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center"
          aria-hidden
        >
          <div className="h-14 w-full bg-gradient-to-t from-background via-background/95 to-transparent" />
          <div className="font-display -mt-2 mb-2 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-surface px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm">
            {hintLabel}
            <ChevronDown className="size-3.5 animate-bounce" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
