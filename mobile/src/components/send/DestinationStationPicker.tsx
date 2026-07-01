import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OPERATOR_ACCENT, SUPPORTED_OPERATORS } from "@/lib/operators";
import { filterStationsByOperator, searchStations } from "@/lib/stations";
import type { Operator, Station } from "@/types/parcel";
import { colors, fonts, radii, spacing } from "@/constants/theme";

type DestinationStationPickerProps = {
  stations: Station[];
  value: string;
  onChange: (stationId: string) => void;
  error?: string;
};

function stationLabel(station: Station) {
  return `${station.name}, ${station.city} · ${station.operator}`;
}

export function DestinationStationPicker({
  stations,
  value,
  onChange,
  error,
}: DestinationStationPickerProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [operator, setOperator] = useState<Operator | "all">("all");

  const selected = stations.find((s) => s.id === value);

  const filtered = useMemo(() => {
    const byOperator = filterStationsByOperator(stations, operator);
    return searchStations(query, byOperator);
  }, [stations, query, operator]);

  function openPicker() {
    setQuery("");
    setOperator("all");
    setOpen(true);
  }

  function closePicker() {
    setOpen(false);
    setQuery("");
  }

  function pickStation(stationId: string) {
    onChange(stationId);
    closePicker();
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Destination station</Text>
      <Pressable
        onPress={openPicker}
        style={[styles.trigger, error ? styles.triggerError : null]}
        accessibilityRole="button"
        accessibilityLabel="Choose destination station"
      >
        <View style={styles.triggerBody}>
          {selected ? (
            <>
              <View
                style={[
                  styles.operatorDot,
                  { backgroundColor: OPERATOR_ACCENT[selected.operator] },
                ]}
              />
              <Text style={styles.triggerText} numberOfLines={2}>
                {stationLabel(selected)}
              </Text>
            </>
          ) : (
            <Text style={styles.triggerPlaceholder}>Tap to choose a station</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.hint}>Search by city or station name — no scrolling through the full list</Text>

      <Modal visible={open} animationType="slide" onRequestClose={closePicker}>
        <View style={[styles.sheet, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Destination station</Text>
            <Pressable onPress={closePicker} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search city or station..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filters}>
            {(["all", ...SUPPORTED_OPERATORS] as const).map((op) => (
              <Pressable
                key={op}
                onPress={() => setOperator(op)}
                style={[styles.filterChip, operator === op && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, operator === op && styles.filterTextActive]}>
                  {op === "all" ? "All" : op}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.resultCount}>
            {filtered.length} station{filtered.length === 1 ? "" : "s"}
          </Text>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, spacing.lg),
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={32} color={colors.muted} />
                <Text style={styles.emptyText}>No stations match your search</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === value;
              return (
                <Pressable
                  onPress={() => pickStation(item.id)}
                  style={[styles.row, isSelected && styles.rowSelected]}
                >
                  <View
                    style={[
                      styles.operatorDot,
                      { backgroundColor: OPERATOR_ACCENT[item.operator] },
                    ]}
                  />
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, isSelected && styles.rowTitleSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {item.city} · {item.operator}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  label: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  triggerBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  triggerText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 20,
  },
  triggerPlaceholder: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
  },
  operatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  error: {
    fontFamily: fonts.body,
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
  hint: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    lineHeight: 15,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.foreground,
    paddingVertical: 10,
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
  resultCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.foreground,
  },
  rowTitleSelected: {
    fontFamily: fonts.displaySemibold,
    color: colors.primary,
  },
  rowMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
  },
});
