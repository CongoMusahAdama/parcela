"use client";

import { useEffect, useState } from "react";

/** True only after mount — use to defer locale/time text that differs between SSR and the browser. */
export function useClientReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}
