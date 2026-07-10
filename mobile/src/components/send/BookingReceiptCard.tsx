import { StyleSheet, Text, View } from "react-native";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { resolveBookingOperator } from "@/lib/booking";
import { buildParcelTagFields, type ParcelTagFields } from "@/lib/parcel-tag";
import { getOperatorLabel } from "@/lib/operators";
import type { PreBooking } from "@/types/parcel";
import { colors, fonts } from "@/constants/theme";

function TagDivider() {
  return <View style={styles.divider} />;
}

function TagField({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <View style={[styles.field, wide && styles.fieldWide]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, mono && styles.fieldMono]}>{value}</Text>
    </View>
  );
}

type ParcelTagReceiptCardProps = {
  tag: ParcelTagFields;
  variant?: "counter-tag" | "pre-booking";
};

function ParcelTagReceiptCard({ tag, variant = "pre-booking" }: ParcelTagReceiptCardProps) {
  const isCounter = variant === "counter-tag";

  return (
    <View style={styles.card}>
      <OperatorLogo operator={tag.operator} variant="watermark" />

      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <OperatorLogo operator={tag.operator} height={28} />
            <Text style={styles.headerSub}>
              {getOperatorLabel(tag.operator)} · Parcel tag
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.fieldLabel}>Receipt no.</Text>
            <Text style={styles.receiptNo}>{tag.receiptNumber}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <TagField label="Tracking ID" value={tag.pickupCode} mono />
          <TagField label="Date & time" value={tag.dateTime} />
          <TagField label="Booking ref" value={tag.bookingReference} mono wide />
        </View>

        <TagDivider />

        <View style={styles.routeRow}>
          <View style={styles.routeCol}>
            <Text style={styles.routeLabel}>Origin</Text>
            <Text style={styles.routeCity}>{tag.originRouteLabel}</Text>
            <Text style={styles.routeStation}>{tag.originStationName}</Text>
          </View>
          <Text style={styles.routeArrow}>→</Text>
          <View style={styles.routeCol}>
            <Text style={styles.routeLabel}>Destination</Text>
            <Text style={styles.routeCity}>{tag.destinationRouteLabel}</Text>
            <Text style={styles.routeStation}>{tag.destinationStationName}</Text>
          </View>
        </View>

        <TagDivider />

        <View style={styles.grid}>
          <TagField label="Sender" value={tag.senderName} />
          <TagField label="Contact" value={tag.senderPhone} mono />
          <TagField label="Receiver" value={tag.recipientName} />
          <TagField label="Contact" value={tag.recipientPhone} mono />
        </View>

        <TagDivider />

        <View style={styles.contentsRow}>
          <TagField label="Contents" value={tag.contents} wide />
          <TagField label="Desc." value={tag.descriptionCode} mono />
          <TagField label="Count" value={String(tag.itemCount)} />
        </View>

        <TagDivider />

        <View style={styles.grid}>
          <TagField label="Status" value={tag.statusLabel} />
          {isCounter && tag.busNumber ? (
            <TagField label="Bus no." value={tag.busNumber} mono />
          ) : (
            <TagField label="Transport" value={getOperatorLabel(tag.operator)} />
          )}
        </View>

        <Text style={styles.footerNote}>
          {isCounter
            ? "Copy these details onto the blank parcel tag and attach it to the parcel before loading the bus."
            : `Show this receipt at ${tag.originStationName}. Staff will verify your parcel and fill the physical tag at the counter.`}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerCode}>{tag.pickupCode.replace(/-/g, "")}</Text>
      </View>
    </View>
  );
}

type BookingReceiptCardProps = {
  booking: PreBooking;
};

export function BookingReceiptCard({ booking }: BookingReceiptCardProps) {
  const operator = resolveBookingOperator(booking);
  const tag = buildParcelTagFields({
    operator,
    bookingReference: booking.bookingReference,
    pickupCode: booking.pickupCode,
    loggedAt: booking.createdAt,
    senderName: booking.senderName,
    senderPhone: booking.senderPhone,
    recipientName: booking.recipientName,
    recipientPhone: booking.recipientPhone,
    originStationId: booking.stationId,
    destinationStationId: booking.destinationStationId,
    originStationName: booking.stationName,
    destinationStationName: booking.destinationStationName,
    originStationCode: booking.stationCode,
    items: booking.items,
    statusLabel: "Awaiting drop-off",
  });

  return <ParcelTagReceiptCard tag={tag} variant="pre-booking" />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  inner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.foreground,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerRight: {
    alignItems: "flex-end",
    maxWidth: "46%",
  },
  headerSub: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
  },
  receiptNo: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "right",
  },
  divider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    marginVertical: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  field: {
    width: "47%",
    minWidth: 130,
  },
  fieldWide: {
    width: "100%",
  },
  fieldLabel: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
  },
  fieldValue: {
    fontFamily: fonts.bodySemibold,
    marginTop: 2,
    fontSize: 12,
    color: colors.foreground,
    lineHeight: 16,
  },
  fieldMono: {
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 4,
  },
  routeCol: {
    flex: 1,
    alignItems: "center",
  },
  routeLabel: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
  },
  routeCity: {
    fontFamily: fonts.display,
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.foreground,
    textAlign: "center",
  },
  routeStation: {
    marginTop: 4,
    fontSize: 10,
    color: colors.muted,
    textAlign: "center",
  },
  routeArrow: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: "900",
    color: colors.primary,
  },
  contentsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "flex-start",
  },
  footerNote: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    fontSize: 10,
    lineHeight: 15,
    color: colors.muted,
  },
  footer: {
    backgroundColor: colors.foreground,
    paddingVertical: 8,
    alignItems: "center",
  },
  footerCode: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    color: "#fff",
  },
});
