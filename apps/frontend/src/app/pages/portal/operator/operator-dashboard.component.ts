import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Trip } from '../../../core/models/trip.model';
import { AuthService } from '../../../core/services/auth.service';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { TripsApiService } from '../../../core/services/trips-api.service';
import { extractApiErrorMessage } from '../../../core/utils/auth.util';
import {
  dayRangeIso,
  formatDate,
  formatTime,
  isPopulatedRoute,
} from '../../../core/utils/format.util';

@Component({
  selector: 'app-operator-dashboard',
  imports: [RouterLink, Button, Tag],
  template: `
    @if (loading()) {
      <div class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
      </div>
    } @else if (error()) {
      <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        {{ error() }}
      </div>
    } @else {
      <div class="grid gap-4 sm:grid-cols-3">
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Today's trips</p>
          <p class="mt-2 text-3xl font-bold">{{ todayTrips().length }}</p>
        </article>
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Active trips</p>
          <p class="mt-2 text-3xl font-bold">{{ activeTrips().length }}</p>
        </article>
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Confirmed bookings</p>
          <p class="mt-2 text-3xl font-bold">{{ confirmedBookings() }}</p>
        </article>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <p-button label="New POS booking" icon="pi pi-shopping-cart" routerLink="/portal/operator/pos" />
        <p-button
          label="Check in passenger"
          icon="pi pi-check-circle"
          [outlined]="true"
          routerLink="/portal/operator/check-in"
        />
        <p-button
          label="Manage trips"
          icon="pi pi-calendar"
          [outlined]="true"
          severity="secondary"
          routerLink="/portal/operator/trips"
        />
      </div>

      <section class="mt-8 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div class="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 class="text-lg font-semibold">Today's departures</h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ formatDate(today) }}</p>
        </div>

        @if (todayTrips().length === 0) {
          <p class="p-6 text-sm text-neutral-500 dark:text-neutral-400">No trips scheduled for today.</p>
        } @else {
          <div class="divide-y divide-neutral-200 dark:divide-neutral-800">
            @for (trip of todayTrips(); track trip._id) {
              <div class="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold">
                      {{ formatTime(trip.departureTime) }} → {{ formatTime(trip.arrivalTime) }}
                    </p>
                    <p-tag [value]="trip.status" [rounded]="true" />
                  </div>
                  @if (isPopulatedRoute(trip.route)) {
                    <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {{ trip.route.origin }} → {{ trip.route.destination }}
                    </p>
                  }
                  <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {{ trip.availableSeats }} seats left
                  </p>
                </div>
                <p-button
                  label="Book walk-in"
                  icon="pi pi-ticket"
                  [text]="true"
                  [routerLink]="['/portal/operator/pos']"
                  [queryParams]="{ tripId: trip._id }"
                />
              </div>
            }
          </div>
        }
      </section>
    }
  `,
})
export class OperatorDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly bookingsApi = inject(BookingsApiService);

  protected readonly today = new Date();
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly todayTrips = signal<Trip[]>([]);
  protected readonly confirmedBookings = signal(0);

  protected readonly activeTrips = computed(() =>
    this.todayTrips().filter((trip) =>
      ['scheduled', 'boarding', 'in_transit'].includes(trip.status),
    ),
  );

  protected readonly formatDate = formatDate;
  protected readonly formatTime = formatTime;
  protected readonly isPopulatedRoute = isPopulatedRoute;

  ngOnInit(): void {
    const companyId = this.auth.user()?.company;
    if (!companyId) {
      this.error.set('Your account is not linked to a company.');
      this.loading.set(false);
      return;
    }

    const range = dayRangeIso(this.today);

    this.tripsApi
      .search({
        company: companyId,
        departureFrom: range.departureFrom,
        departureTo: range.departureTo,
      })
      .subscribe({
        next: (trips) => {
          this.todayTrips.set(
            trips.sort(
              (a, b) =>
                new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
            ),
          );
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to load trips'));
          this.loading.set(false);
        },
      });

    this.bookingsApi.list({ status: 'confirmed' }).subscribe({
      next: (bookings) => this.confirmedBookings.set(bookings.length),
      error: () => this.confirmedBookings.set(0),
    });
  }
}
