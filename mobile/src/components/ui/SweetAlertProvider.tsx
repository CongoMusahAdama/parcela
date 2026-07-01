import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radii } from "@/constants/theme";

type AlertType = "success" | "error";

type AlertOptions = {
  title: string;
  text?: string;
  confirmText?: string;
};

type AlertState = AlertOptions & {
  type: AlertType;
  resolve: () => void;
};

type SweetAlertContextValue = {
  success: (options: AlertOptions) => Promise<void>;
  error: (options: AlertOptions) => Promise<void>;
};

const SweetAlertContext = createContext<SweetAlertContextValue | null>(null);

export function SweetAlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const alertRef = useRef<AlertState | null>(null);
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  useEffect(() => {
    if (!alert) return;

    scale.setValue(0.92);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [alert, opacity, scale]);

  const show = useCallback((type: AlertType, options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setAlert({ ...options, type, resolve });
    });
  }, []);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      alertRef.current?.resolve();
      setAlert(null);
    });
  }, [opacity, scale]);

  const value = useMemo<SweetAlertContextValue>(
    () => ({
      success: (options) => show("success", options),
      error: (options) => show("error", options),
    }),
    [show]
  );

  const isSuccess = alert?.type === "success";
  const iconName = isSuccess ? "checkmark-circle" : "close-circle";
  const iconColor = isSuccess ? colors.primary : colors.danger;
  const iconBg = isSuccess ? colors.primary + "14" : colors.danger + "14";

  return (
    <SweetAlertContext.Provider value={value}>
      {children}
      <Modal visible={!!alert} transparent animationType="none" onRequestClose={dismiss}>
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
          <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <View style={[styles.iconRing, { backgroundColor: iconBg }]}>
              <Ionicons name={iconName} size={44} color={iconColor} />
            </View>
            <Text style={styles.title}>{alert?.title}</Text>
            {alert?.text ? <Text style={styles.text}>{alert.text}</Text> : null}
            <Pressable
              onPress={dismiss}
              style={[styles.confirmBtn, !isSuccess && styles.confirmBtnError]}
            >
              <Text style={styles.confirmText}>{alert?.confirmText ?? "Got it"}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SweetAlertContext.Provider>
  );
}

export function useSweetAlert() {
  const ctx = useContext(SweetAlertContext);
  if (!ctx) {
    throw new Error("useSweetAlert must be used within SweetAlertProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: "center",
  },
  confirmBtn: {
    marginTop: 22,
    width: "100%",
    minHeight: 46,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnError: {
    backgroundColor: colors.danger,
  },
  confirmText: {
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
