import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Logo } from "@/components/brand/Logo";
import { HomeActionButton } from "@/components/home/HomeActionButton";
import { ScreenIllustration } from "@/components/ui/ScreenIllustration";
import { WelcomeScreen } from "@/components/home/WelcomeScreen";
import { Screen } from "@/components/ui/Screen";
import { useSplashGate } from "@/contexts/SplashGate";
import { requestSendLocation } from "@/lib/sendLocation";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome";
import { colors, fonts, radii, spacing } from "@/constants/theme";

function MainHome() {
  const router = useRouter();
  const [startingSend, setStartingSend] = useState(false);

  async function handleSendParcel() {
    if (startingSend) return;
    setStartingSend(true);
    await requestSendLocation();
    router.push("/send");
    setStartingSend(false);
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>VIP & STC only</Text>
        </View>
        <Logo size="lg" />
      </View>

      <View style={styles.hero}>
        <ScreenIllustration name="image" height={260} maxWidth={320} />
        <Text style={styles.title}>
          Send parcels through{"\n"}
          <Text style={styles.titleAccent}>bus stations, easily</Text>
        </Text>
        <Text style={styles.subtitle}>
          Pre-book in minutes. No account needed — drop off at your station.
        </Text>
      </View>

      <View style={styles.actions}>
        <HomeActionButton
          title={startingSend ? "Getting your location..." : "Send a parcel"}
          description={startingSend ? undefined : "Find a station and pre-book"}
          icon="cube-outline"
          variant="primary"
          onPress={handleSendParcel}
          loading={startingSend}
        />
        <HomeActionButton
          title="Track a parcel"
          description="Enter the code from your receipt"
          icon="location-outline"
          variant="secondary"
          onPress={() => router.push("/track")}
        />
      </View>
    </Screen>
  );
}

export default function HomeScreen() {
  const { done: splashDone } = useSplashGate();
  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!splashDone) return;
    hasSeenWelcome().then((seen) => {
      setShowWelcome(!seen);
      setReady(true);
    });
  }, [splashDone]);

  async function handleGetStarted() {
    await markWelcomeSeen();
    setShowWelcome(false);
  }

  if (!ready) {
    return <View style={styles.boot} />;
  }

  if (showWelcome) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  return <MainHome />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.sm,
    justifyContent: "flex-start",
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.muted,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 25,
    textAlign: "center",
    color: colors.foreground,
    lineHeight: 31,
    marginTop: spacing.md,
    letterSpacing: -0.3,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.body,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: colors.muted,
    paddingHorizontal: 12,
    maxWidth: 300,
  },
  actions: {
    marginTop: spacing.xl,
    gap: 12,
  },
});
