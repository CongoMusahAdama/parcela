"use client";

import { useEffect, useState } from "react";
import { MainHomeContent } from "@/components/home/MainHomeContent";
import { WelcomeScreen } from "@/components/home/WelcomeScreen";
import { useSplashGate } from "@/components/brand/SplashGate";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome";

export function HomePageContent() {
  const { done: splashDone } = useSplashGate();
  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!splashDone) return;
    setShowWelcome(!hasSeenWelcome());
    setReady(true);
  }, [splashDone]);

  function handleGetStarted() {
    markWelcomeSeen();
    setShowWelcome(false);
  }

  if (!ready) {
    return <div className="min-h-dvh bg-background" aria-hidden />;
  }

  if (showWelcome) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  return <MainHomeContent />;
}
