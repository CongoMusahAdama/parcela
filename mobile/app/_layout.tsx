import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useLayoutEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashOverlay } from "@/components/brand/SplashOverlay";
import { SweetAlertProvider } from "@/components/ui/SweetAlertProvider";
import { SplashGateProvider } from "@/contexts/SplashGate";
import { TypographyReadyProvider } from "@/contexts/TypographyReady";
import { useAppFonts } from "@/hooks/useAppFonts";
import { setupGlobalFonts } from "@/lib/setupGlobalFonts";

export default function RootLayout() {
  const [fontsLoaded] = useAppFonts();
  const [typographyReady, setTypographyReady] = useState(false);

  useLayoutEffect(() => {
    if (!fontsLoaded) {
      setTypographyReady(false);
      return;
    }
    setupGlobalFonts();
    setTypographyReady(true);
  }, [fontsLoaded]);

  const appReady = fontsLoaded && typographyReady;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SplashGateProvider>
          <TypographyReadyProvider ready={appReady}>
            <SweetAlertProvider>
              <StatusBar style="dark" />
              <SplashOverlay />
              {appReady ? (
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                    contentStyle: { backgroundColor: "#f4f7fb" },
                  }}
                />
              ) : null}
            </SweetAlertProvider>
          </TypographyReadyProvider>
        </SplashGateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
