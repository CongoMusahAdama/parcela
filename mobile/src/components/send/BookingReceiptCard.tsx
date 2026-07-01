import { StyleSheet, Text, View } from "react-native";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { resolveBookingOperator, resolveDestinationOperator } from "@/lib/booking";
import { formatItemLabel } from "@/lib/bookingItems";
import { OPERATOR_LABELS } from "@/lib/operators";
import type { PreBooking } from "@/types/parcel";
import { colors, fonts } from "@/constants/theme";

function formatReceiptDate(iso: string) {
  try {
    const d = new Date(iso);
    const date = d
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .toUpperCase();
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${date} | ${time}`;
  } catch {
    return iso;
  }
}

function ReceiptDivider() {
  return <View style={styles.divider} />;
}

function ReceiptField({
  label,
  value,
  primary = false,
  mono = false,
}: {
  label: string;
  value: string;
  primary?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text
        style={[
          styles.fieldValue,
          primary && styles.fieldValuePrimary,
          mono && styles.fieldValueMono,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

type BookingReceiptCardProps = {
  booking: PreBooking;
};

export function BookingReceiptCard({ booking }: BookingReceiptCardProps) {
  const operator = resolveBookingOperator(booking);
  const destinationOperator = resolveDestinationOperator(booking);
  const code = booking.pickupCode.replace(/-/g, "");

  return (
    <View style={styles.card}>
      <OperatorLogo operator={operator} variant="watermark" />

      <View style={styles.inner}>
        <View style={styles.thankYou}>
          <OperatorLogo operator={operator} height={36} />
          <Text style={styles.thankTitle}>Thank you</Text>
          <Text style={styles.thankSub}>Your booking is confirmed</Text>
        </View>

        <ReceiptDivider />

        <View style={styles.grid}>
          <ReceiptField label="Tracking ID" value={booking.pickupCode} primary />
          <ReceiptField label="Status" value="Awaiting drop-off" />
          <ReceiptField label="Date & time" value={formatReceiptDate(booking.createdAt)} />
          <ReceiptField label="Transport" value={OPERATOR_LABELS[operator]} />
        </View>

        <View style={styles.routeBox}>
          <View style={styles.grid}>
            <ReceiptField label="Drop-off" value={booking.stationName} />
            <ReceiptField label="Destination" value={booking.destinationStationName} />
          </View>
          {destinationOperator && destinationOperator !== operator && (
            <Text style={styles.routeNote}>
              Destination via {OPERATOR_LABELS[destinationOperator]}
            </Text>
          )}
        </View>

        <ReceiptDivider />

        <View style={styles.grid}>
          <ReceiptField label="Sender" value={booking.senderName} />
          <ReceiptField label="Phone" value={booking.senderPhone} />
          <ReceiptField label="Recipient" value={booking.recipientName} />
          <ReceiptField label="Phone" value={booking.recipientPhone} />
        </View>

        <ReceiptDivider />

        <View style={styles.itemsSection}>
          <Text style={styles.nextTitle}>
            Items ({booking.items.length}) — one ID tracks all
          </Text>
          {booking.items.map((item, index) => (
            <Text key={item.id} style={styles.itemLine}>
              {formatItemLabel(item, index)}
            </Text>
          ))}
        </View>

        <ReceiptDivider />

        <View style={styles.grid}>
          <ReceiptField label="Booking ref" value={booking.bookingReference} mono />
          <ReceiptField label="Item count" value={String(booking.items.length)} />
        </View>

        <ReceiptDivider />

        <View style={styles.nextSteps}>
          <Text style={styles.nextTitle}>Next steps</Text>
          <Text style={styles.nextItem}>1. Pack your items and go to {booking.stationName}</Text>
          <Text style={styles.nextItem}>
            2. Show this pre-booking receipt to staff at the counter
          </Text>
          <Text style={styles.nextItem}>
            3. Staff will give you a tracking receipt — send it to your recipient so they can track
            and collect
          </Text>
        </View>

        <ReceiptDivider />

        <View style={styles.barcode}>
          <View style={styles.bars}>
            {code.split("").map((char, i) => (
              <View
                key={`${char}-${i}`}
                style={{
                  width: 2,
                  height: 20 + (char.charCodeAt(0) % 10),
                  backgroundColor: colors.primary,
                  opacity: 0.75,
                }}
              />
            ))}
          </View>
          <Text style={styles.barcodeText}>{code}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Parcela · VIP & STC only</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  inner: {
    paddingHorizontal: 20,
    zIndex: 1,
  },
  thankYou: {
    alignItems: "center",
    paddingVertical: 16,
  },
  thankTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    marginTop: 8,
  },
  thankSub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  divider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 12,
    gap: 12,
  },
  field: {
    width: "47%",
    minWidth: 140,
  },
  fieldLabel: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
  },
  fieldValue: {
    fontFamily: fonts.bodySemibold,
    marginTop: 4,
    fontSize: 13,
    color: colors.foreground,
    lineHeight: 18,
  },
  fieldValuePrimary: {
    fontFamily: fonts.mono,
    color: colors.primary,
  },
  fieldValueMono: {
    fontFamily: fonts.mono,
  },
  routeBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#99f6e4",
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 4,
  },
  routeNote: {
    marginTop: 8,
    fontSize: 11,
    color: colors.muted,
  },
  nextSteps: {
    paddingVertical: 12,
  },
  nextTitle: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
  },
  nextItem: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: colors.foreground,
  },
  itemsSection: {
    paddingVertical: 12,
    gap: 6,
  },
  itemLine: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.foreground,
  },
  barcode: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 1,
    height: 36,
  },
  barcodeText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.primary,
  },
  footer: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  footerText: {
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
});
