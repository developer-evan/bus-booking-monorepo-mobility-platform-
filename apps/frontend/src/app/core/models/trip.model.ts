import { BusRoute, CompanySummary } from './route.model';

export type TripStatus =
  | 'scheduled'
  | 'boarding'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export interface BusSummary {
  _id: string;
  plateNumber: string;
  model?: string;
  seatCapacity: number;
  busType: string;
  amenities: string[];
  status: string;
}

export interface Trip {
  _id: string;
  company: CompanySummary | string;
  route: BusRoute | string;
  bus: BusSummary | string;
  departureTime: string;
  arrivalTime: string;
  pricePerSeat: number;
  availableSeats: number;
  status: TripStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripSearchQuery {
  origin?: string;
  destination?: string;
  departureFrom?: string;
  departureTo?: string;
  route?: string;
  bus?: string;
  status?: TripStatus;
  company?: string;
}

export interface TripSearchParams {
  from: string;
  to: string;
  date: Date;
  passengers: number;
}
