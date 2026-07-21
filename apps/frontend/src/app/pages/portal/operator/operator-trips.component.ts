import { Component, inject, OnInit, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Trip, TripStatus } from '../../../core/models/trip.model';
import { AuthService } from '../../../core/services/auth.service';
import { TripsApiService } from '../../../core/services/trips-api.service';
import { extractApiErrorMessage } from '../../../core/utils/auth.util';
import {
  formatDate,
  formatTime,
  isPopulatedRoute,
} from '../../../core/utils/format.util';

@Component({
  selector: 'app-operator-trips',
  imports: [Button, Tag],
  template: `
    @if (loading()) {
      <div class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
      </div>
    } @else if (error()) {
      <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        {{ error() }}
      </div>
    } @else if (trips().length === 0) {
      <div class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <p class="text-neutral-500 dark:text-neutral-400">No upcoming trips found for your company.</p>
      </div>
    } @else {
      <div class="grid gap-4">
        @for (trip of trips(); track trip._id) {
          <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg font-semibold">
                    {{ formatTime(trip.departureTime) }} · {{ formatDate(trip.departureTime) }}
                  </h2>
                  <p-tag [value]="trip.status" [rounded]="true" />
                </div>
                @if (isPopulatedRoute(trip.route)) {
                  <p class="mt-2 text-neutral-600 dark:text-neutral-300">
                    {{ trip.route.origin }} → {{ trip.route.destination }}
                  </p>
                  <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {{ trip.route.originStation }} → {{ trip.route.destinationStation }}
                  </p>
                }
                <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Arrives {{ formatTime(trip.arrivalTime) }} · {{ trip.availableSeats }} seats left
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                @for (action of actionsForTrip(trip); track action.status) {
                  <p-button
                    [label]="action.label"
                    [icon]="action.icon"
                    [outlined]="true"
                    [severity]="action.severity"
                    [loading]="updatingTripId() === trip._id"
                    (onClick)="updateTripStatus(trip, action.status)"
                  />
                }
              </div>
            </div>

            @if (updateError() && updatingTripId() === trip._id) {
              <p class="mt-3 text-sm text-red-600 dark:text-red-400">{{ updateError() }}</p>
            }
          </article>
        }
      </div>
    }
  `,
})
export class OperatorTripsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly tripsApi = inject(TripsApiService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly updateError = signal<string | null>(null);
  protected readonly updatingTripId = signal<string | null>(null);
  protected readonly trips = signal<Trip[]>([]);

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

    this.tripsApi
      .search({
        company: companyId,
        departureFrom: new Date().toISOString(),
      })
      .subscribe({
        next: (trips) => {
          this.trips.set(
            trips
              .filter((trip) => trip.status !== 'cancelled')
              .sort(
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
  }

  protected actionsForTrip(trip: Trip): Array<{
    label: string;
    status: TripStatus;
    icon: string;
    severity: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';
  }> {
    switch (trip.status) {
      case 'scheduled':
        return [
          { label: 'Start boarding', status: 'boarding', icon: 'pi pi-users', severity: 'info' },
          { label: 'Cancel trip', status: 'cancelled', icon: 'pi pi-times', severity: 'danger' },
        ];
      case 'boarding':
        return [
          { label: 'Depart', status: 'in_transit', icon: 'pi pi-send', severity: 'primary' },
        ];
      case 'in_transit':
        return [
          { label: 'Mark completed', status: 'completed', icon: 'pi pi-check', severity: 'success' },
        ];
      default:
        return [];
    }
  }

  protected updateTripStatus(trip: Trip, status: TripStatus): void {
    this.updatingTripId.set(trip._id);
    this.updateError.set(null);

    this.tripsApi.update(trip._id, { status }).subscribe({
      next: (updated) => {
        this.trips.update((items) =>
          items.map((item) => (item._id === updated._id ? updated : item)),
        );
        this.updatingTripId.set(null);
      },
      error: (err) => {
        this.updateError.set(extractApiErrorMessage(err, 'Failed to update trip'));
        this.updatingTripId.set(null);
      },
    });
  }
}
