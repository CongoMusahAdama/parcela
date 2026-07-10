import { ScreenIllustration } from "@/components/ui/ScreenIllustration";
import { StationMapView } from "@/components/send/StationMapView";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { formatDistance } from "@/lib/format";
import { getSendLocation, requestSendLocation } from "@/lib/sendLocation";
import type { UserCoords } from "@/lib/sendLocation";
import {
  ensureStationsLoaded,
  filterStationsByOperator,
  listStationOperatorCodes,
  searchStations,
  sortStationsAlphabetically,
  sortStationsByDistance,
} from "@/lib/stations";
import { ensureOperatorBrandingLoaded, getOperatorLabel, listOperatorFilterOptions } from "@/lib/operators";
import type { Operator, Station } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

type StationWithDistance = Station & { distanceKm?: number };
type ViewMode = "list" | "map";

function StationRow({
  station,
  onPress,
}: {
  station: StationWithDistance;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.stationCard, pressed && styles.pressed]}>
      <View style={[styles.operatorDot, { backgroundColor: colors.primary }]} />
      <View style={styles.stationBody}>
        <View style={styles.stationTitleRow}>
          <Text style={styles.stationName}>{station.name}</Text>
          {station.distanceKm !== undefined && (
            <Text style={styles.distance}>{formatDistance(station.distanceKm)}</Text>
          )}
        </View>
        <Text style={styles.stationMeta}>
          {station.city} · {station.code} · {getOperatorLabel(station.operator)}
        </Text>
        <Text style={styles.stationAddr} numberOfLines={1}>
          {station.address}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

export default function SendStationsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [operator, setOperator] = useState<Operator | "all">("all");
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [baseStations, setBaseStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  useEffect(() => {
    void Promise.all([ensureStationsLoaded(), ensureOperatorBrandingLoaded()])
      .then(([stations]) => setBaseStations(stations))
      .finally(() => setLoadingStations(false));
  }, []);

  useEffect(() => {
    setUserCoords(getSendLocation());
  }, []);

  useEffect(() => {
    if (viewMode !== "map" || userCoords) return;
    requestSendLocation().then((coords) => {
      if (coords) setUserCoords(coords);
    });
  }, [viewMode, userCoords]);

  const operatorFilters = useMemo(
    () => listOperatorFilterOptions(listStationOperatorCodes(baseStations)),
    [baseStations],
  );

  const stations = useMemo((): StationWithDistance[] => {
    const filtered = filterStationsByOperator(baseStations, operator);
    const searched = searchStations(query, filtered);

    if (userCoords) {
      return sortStationsByDistance(searched, userCoords.lat, userCoords.lng);
    }
    return sortStationsAlphabetically(searched).map((s) => ({ ...s, distanceKm: undefined }));
  }, [query, operator, userCoords, baseStations]);

  const isMap = viewMode === "map";

  if (loadingStations) {
    return (
      <Screen>
        <Text style={styles.title}>Loading stations...</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentStyle={styles.flex}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {!isMap ? (
          <ScreenIllustration name="sender" height={220} maxWidth={300} />
        ) : null}

        <Text style={styles.step}>Step 1 of 3</Text>
        <Text style={styles.title}>Choose drop-off station</Text>
        <Text style={styles.subtitle}>Parcela drop-off stations across Ghana</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search city or station..."
          placeholderTextColor={colors.muted}
          style={styles.search}
        />

        <View style={styles.filters}>
          <Pressable
            onPress={() => setOperator("all")}
            style={[styles.filterChip, operator === "all" && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, operator === "all" && styles.filterTextActive]}>
              All
            </Text>
          </Pressable>
          {operatorFilters.map(({ code, label }) => (
            <Pressable
              key={code}
              onPress={() => setOperator(code)}
              style={[styles.filterChip, operator === code && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, operator === code && styles.filterTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.viewToggle}>
          {(
            [
              { id: "list" as const, label: "List", icon: "list-outline" as const },
              { id: "map" as const, label: "Map", icon: "map-outline" as const },
            ] as const
          ).map(({ id, label, icon }) => {
            const active = viewMode === id;
            return (
              <Pressable
                key={id}
                onPress={() => setViewMode(id)}
                style={[styles.toggleBtn, active && styles.toggleBtnActive]}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={active ? "#fff" : colors.muted}
                />
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {stations.length} station{stations.length !== 1 ? "s" : ""} found
          </Text>
          <Text style={styles.countHint}>VIP & STC only</Text>
        </View>
      </View>

      {stations.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="search-outline" size={28} color={colors.muted} />
          <Text style={styles.emptyTitle}>No stations found</Text>
          <Text style={styles.emptyDesc}>Try another name, city, or operator filter</Text>
        </View>
      ) : isMap ? (
        <View style={styles.mapWrap}>
          <StationMapView stations={stations} userCoords={userCoords} />
        </View>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <StationRow
              station={item}
              onPress={() => router.push({ pathname: "/send/book", params: { stationId: item.id } })}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, paddingHorizontal: 0 },
  top: { paddingHorizontal: spacing.md, paddingBottom: 8 },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  backText: {
    fontFamily: fonts.displaySemibold,
    color: colors.primary,
    fontSize: 15,
  },
  step: {
    fontFamily: fonts.display,
    fontSize: 10,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.foreground,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
  },
  search: {
    fontFamily: fonts.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 12,
    color: colors.muted,
  },
  filterTextActive: {
    color: "#fff",
  },
  viewToggle: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.sm,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 13,
    color: colors.muted,
  },
  toggleTextActive: {
    color: "#fff",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  countText: {
    fontFamily: fonts.displaySemibold,
    fontSize: 13,
    color: colors.foreground,
  },
  countHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
  },
  mapWrap: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    minHeight: 280,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: 10,
  },
  stationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    marginBottom: 10,
  },
  pressed: { opacity: 0.9 },
  operatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stationBody: { flex: 1 },
  stationTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  stationName: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.foreground,
  },
  distance: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    color: colors.primary,
  },
  stationMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  stationAddr: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.foreground,
    marginTop: 12,
  },
  emptyDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 19,
  },
});
