export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  user?: string | null;
  trip: unknown;
  company: string;
  seatNumbers: string[];
  passengerCount: number;
  totalPrice: number;
  bookingReference: string;
  status: BookingStatus;
  channel: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  trip: string;
  seatNumbers: string[];
}
