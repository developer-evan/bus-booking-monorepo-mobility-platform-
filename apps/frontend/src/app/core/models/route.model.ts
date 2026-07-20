export interface CompanySummary {
  _id: string;
  name: string;
  slug: string;
}

export interface BusRoute {
  _id: string;
  company: CompanySummary | string;
  origin: string;
  destination: string;
  originStation: string;
  destinationStation: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  intermediateStops: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RouteQuery {
  origin?: string;
  destination?: string;
  isActive?: boolean;
  company?: string;
}

export interface CityOption {
  label: string;
  value: string;
}

export interface PopularRouteView {
  id: string;
  from: string;
  to: string;
  duration: string;
  price: string | null;
  frequency: string;
  operatorCount: number;
}

export interface PlatformStats {
  routes: number;
  operators: number;
  upcomingTrips: number;
}
