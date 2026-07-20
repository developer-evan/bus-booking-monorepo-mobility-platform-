import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import {
  BusRoute,
  CityOption,
  PlatformStats,
  PopularRouteView,
} from '../models/route.model';
import { Trip } from '../models/trip.model';
import { addDays, dayRangeIso, formatCurrency, formatDuration } from '../utils/format.util';
import { RoutesApiService } from './routes-api.service';
import { TripsApiService } from './trips-api.service';

@Injectable({ providedIn: 'root' })
export class CustomerCatalogService {
  private readonly routesApi = inject(RoutesApiService);
  private readonly tripsApi = inject(TripsApiService);

  getCities(): Observable<CityOption[]> {
    return this.routesApi.list({ isActive: true }).pipe(
      map((routes) => {
        const cities = new Set<string>();

        for (const route of routes) {
          cities.add(route.origin);
          cities.add(route.destination);
        }

        return [...cities]
          .sort((a, b) => a.localeCompare(b))
          .map((city) => ({ label: city, value: city }));
      }),
    );
  }

  getPlatformStats(): Observable<PlatformStats> {
    const now = new Date();
    const departureFrom = now.toISOString();
    const departureTo = addDays(now, 30).toISOString();

    return forkJoin({
      routes: this.routesApi.list({ isActive: true }),
      trips: this.tripsApi.search({
        status: 'scheduled',
        departureFrom,
        departureTo,
      }),
    }).pipe(
      map(({ routes, trips }) => ({
        routes: routes.length,
        operators: new Set(
          routes.map((route) =>
            typeof route.company === 'string' ? route.company : route.company._id,
          ),
        ).size,
        upcomingTrips: trips.length,
      })),
    );
  }

  getPopularRoutes(limit = 4): Observable<PopularRouteView[]> {
    const now = new Date();
    const departureFrom = now.toISOString();
    const departureTo = addDays(now, 30).toISOString();

    return forkJoin({
      routes: this.routesApi.list({ isActive: true }),
      trips: this.tripsApi.search({
        status: 'scheduled',
        departureFrom,
        departureTo,
      }),
    }).pipe(map(({ routes, trips }) => this.buildPopularRoutes(routes, trips, limit)));
  }

  searchTrips(from: string, to: string, date: Date, passengers: number): Observable<Trip[]> {
    const range = dayRangeIso(date);

    return this.tripsApi
      .search({
        origin: from,
        destination: to,
        status: 'scheduled',
        ...range,
      })
      .pipe(
        map((trips) =>
          trips.filter((trip) => trip.availableSeats >= passengers),
        ),
      );
  }

  private buildPopularRoutes(
    routes: BusRoute[],
    trips: Trip[],
    limit: number,
  ): PopularRouteView[] {
    const grouped = new Map<
      string,
      {
        from: string;
        to: string;
        durationMinutes: number;
        minPrice: number | null;
        tripCount: number;
        operators: Set<string>;
      }
    >();

    for (const route of routes) {
      const key = `${route.origin}|${route.destination}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.durationMinutes = Math.min(
          existing.durationMinutes,
          route.estimatedDurationMinutes,
        );
        existing.operators.add(
          typeof route.company === 'string' ? route.company : route.company._id,
        );
        continue;
      }

      grouped.set(key, {
        from: route.origin,
        to: route.destination,
        durationMinutes: route.estimatedDurationMinutes,
        minPrice: null,
        tripCount: 0,
        operators: new Set([
          typeof route.company === 'string' ? route.company : route.company._id,
        ]),
      });
    }

    for (const trip of trips) {
      const route = trip.route;
      if (typeof route === 'string') {
        continue;
      }

      const key = `${route.origin}|${route.destination}`;
      const entry = grouped.get(key);
      if (!entry) {
        continue;
      }

      entry.tripCount += 1;
      entry.minPrice =
        entry.minPrice === null
          ? trip.pricePerSeat
          : Math.min(entry.minPrice, trip.pricePerSeat);
    }

    return [...grouped.values()]
      .sort((a, b) => b.tripCount - a.tripCount || a.from.localeCompare(b.from))
      .slice(0, limit)
      .map((entry, index) => ({
        id: `${entry.from}-${entry.to}-${index}`,
        from: entry.from,
        to: entry.to,
        duration: formatDuration(entry.durationMinutes),
        price: entry.minPrice === null ? null : formatCurrency(entry.minPrice),
        frequency:
          entry.tripCount === 0
            ? 'Check availability'
            : entry.tripCount === 1
              ? '1 upcoming trip'
              : `${entry.tripCount} upcoming trips`,
        operatorCount: entry.operators.size,
      }));
  }
}
