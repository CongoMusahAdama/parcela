import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { OPERATOR_ACCENT } from "@/lib/operators";
import type { Operator } from "@/types/parcel";
import { colors, fonts, radii } from "@/constants/theme";
import { BOLT_LIKE_MAP_STYLE } from "@/lib/mapStyle";

type DestinationStationMapProps = {
  lat: number;
  lng: number;
  name: string;
  operator?: Operator;
};

export function DestinationStationMap({ lat, lng, name, operator }: DestinationStationMapProps) {
  const accent = operator ? OPERATOR_ACCENT[operator] : colors.primary;

  return (
    <View style={styles.wrap}>
      <MapView
        style={styles.map}
        customMapStyle={BOLT_LIKE_MAP_STYLE}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        accessibilityLabel={`Map showing ${name}`}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          pinColor={accent}
        />
      </MapView>
      <Text style={styles.caption} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  map: {
    width: "100%",
    height: 180,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
});
