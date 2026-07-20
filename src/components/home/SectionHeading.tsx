"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
  light?: boolean;
};

export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
  light = false,
}: SectionHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(
        "landing-heading font-display font-bold tracking-tight",
        light ? "text-white" : "text-foreground",
        visible && "is-visible",
        className,
      )}
    >
      <span className="landing-heading-text">{children}</span>
      <span
        className={cn("landing-heading-rule", light ? "bg-white/70" : "bg-primary")}
        aria-hidden
      />
    </Tag>
  );
}
