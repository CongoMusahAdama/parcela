import { useEffect } from "react";

const SCROLL_ROOT_SELECTOR = "[data-lead-scroll-root], [data-staff-scroll-root]";

export function useModalScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const roots: HTMLElement[] = [
      document.documentElement,
      document.body,
      ...Array.from(document.querySelectorAll<HTMLElement>(SCROLL_ROOT_SELECTOR)),
    ];

    const snapshot = roots.map((el) => ({
      el,
      overflow: el.style.overflow,
      overscrollBehavior: el.style.overscrollBehavior,
    }));

    roots.forEach((el) => {
      el.style.overflow = "hidden";
      el.style.overscrollBehavior = "none";
    });

    return () => {
      snapshot.forEach(({ el, overflow, overscrollBehavior }) => {
        el.style.overflow = overflow;
        el.style.overscrollBehavior = overscrollBehavior;
      });
    };
  }, [active]);
}
