export type CreateBookingPayload = {
  stationId: string;
  destinationStationId: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  items: Array<{
    parcelType: 'document' | 'box' | 'envelope' | 'other';
    description: string;
    fragile: boolean;
  }>;
  paymentWho?: 'sender' | 'receiver';
  markPaid?: boolean;
};
