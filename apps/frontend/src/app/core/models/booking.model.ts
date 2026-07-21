import { Trip } from './trip.model';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BookingChannel = 'online' | 'pos';

export interface Booking {
  _id: string;
  user?: string | null;
  trip: Trip | string;
  company: string;
  seatNumbers: string[];
  passengerCount: number;
  totalPrice: number;
  bookingReference: string;
  status: BookingStatus;
  channel: BookingChannel | string;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  bookedBy?: string | { fullName: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  trip: string;
  seatNumbers: string[];
}

export interface CreatePosBookingRequest extends CreateBookingRequest {
  passengerName: string;
  passengerPhone?: string;
  passengerEmail?: string;
}

export interface LookupBookingQuery {
  reference: string;
  phone?: string;
  email?: string;
}

export interface BookingListQuery {
  status?: BookingStatus;
  trip?: string;
}

export interface PaymentSummary {
  _id: string;
  amount: number;
  method: string;
  status: string;
}

export interface PosBookingResult {
  booking: Booking;
  payment: PaymentSummary;
}

export function tripIdFromBooking(booking: Booking): string {
  return typeof booking.trip === 'string' ? booking.trip : booking.trip._id;
}

export function occupiedSeatsFromBookings(bookings: Booking[]): string[] {
  return bookings
    .filter((booking) => booking.status === 'pending' || booking.status === 'confirmed')
    .flatMap((booking) => booking.seatNumbers.map((seat) => seat.toUpperCase()));
}

export function passengerLabel(booking: Booking): string {
  return booking.passengerName ?? 'Passenger';
}
