import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { formatDistance } from "@/lib/format";
import { OPERATOR_ACCENT } from "@/lib/operators";
import type { UserCoords } from "@/lib/sendLocation";
import type { Station } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

type StationWithDistance = Station & { distanceKm?: number };

type StationMapViewProps = {
  stations: StationWithDistance[];
  userCoords: UserCoords | null;
};

export function StationMapView({ stations, userCoords }: StationMapViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<StationWithDistance | null>(null);

  const sortedStations = useMemo(() => {
    if (!userCoords) return stations;
    return [...stations].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }, [stations, userCoords]);

  function confirmSelection(station: StationWithDistance) {
    router.push({ pathname: "/send/book", params: { stationId: station.id } });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <Ionicons name="map-outline" size={18} color={colors.primary} />
        <Text style={styles.bannerText}>
          Map view is available in Expo Go on your phone. Pick a station below on web.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {sortedStations.map((station, index) => {
          const isSelected = selected?.id === station.id;
          return (
            <Pressable
              key={station.id}
              onPress={() => setSelected(station)}
              style={[styles.card, isSelected && styles.cardSelected]}
            >
              <View style={[styles.dot, { backgroundColor: OPERATOR_ACCENT[station.operator] }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{station.name}</Text>
                  {station.distanceKm !== undefined ? (
                    <Text style={styles.distance}>{formatDistance(station.distanceKm)}</Text>
                  ) : index === 0 && userCoords ? (
                    <Text style={styles.nearest}>Nearest</Text>
                  ) : null}
                </View>
                <Text style={styles.meta}>
                  {station.city} · {station.code} · {station.operator}
                </Text>
                <Text style={styles.addr} numberOfLines={2}>
                  {station.address}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {selected ? (
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{selected.name}</Text>
          <Text style={styles.sheetMeta}>
            {selected.city} · {selected.code}
          </Text>
          <Pressable style={styles.sheetBtn} onPress={() => confirmSelection(selected)}>
            <Text style={styles.sheetBtnText}>Select this station</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.primary + "12",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  list: {
    padding: spacing.md,
    gap: 10,
    paddingBottom: 120,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "08",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.displaySemibold,
    fontSize: 15,
    color: colors.foreground,
  },
  distance: {
    fontFamily: fonts.displaySemibold,
    fontSize: 12,
    color: colors.primary,
  },
  nearest: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    color: colors.primary,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
  addr: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.foreground,
  },
  sheetMeta: {
    marginTop: 2,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
  sheetBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  sheetBtnText: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: "#fff",
  },
});
