import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Trip } from '../../core/models/trip.model';
import { CustomerCatalogService } from '../../core/services/customer-catalog.service';
import {
  companyName,
  formatCurrency,
  formatDate,
  formatTime,
  isPopulatedBus,
  isPopulatedRoute,
  parseIsoDate,
} from '../../core/utils/format.util';
import { LandingHeaderComponent } from '../../layout/landing-header/landing-header.component';

@Component({
  selector: 'app-search',
  imports: [RouterLink, Button, Tag, LandingHeaderComponent],
  template: `
    <div class="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <app-landing-header />

      <main class="mx-auto max-w-6xl px-6 py-10">
        <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p-button
              label="Modify search"
              icon="pi pi-arrow-left"
              [text]="true"
              severity="secondary"
              routerLink="/"
            />
            <h1 class="mt-3 text-3xl font-bold tracking-tight">Available trips</h1>
            @if (from() && to() && date()) {
              <p class="mt-2 text-neutral-500 dark:text-neutral-400">
                {{ from() }} → {{ to() }} · {{ formatDate(date()!) }} ·
                {{ passengers() }} passenger{{ passengers() === 1 ? '' : 's' }}
              </p>
            }
          </div>
        </div>

        @if (loading()) {
          <div
            class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900"
          >
            <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
            <p class="mt-4 text-neutral-500 dark:text-neutral-400">Searching trips...</p>
          </div>
        } @else if (error()) {
          <div
            class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <p class="font-medium">Could not load trips</p>
            <p class="mt-1 text-sm">{{ error() }}</p>
            <p-button
              class="mt-4"
              label="Try again"
              icon="pi pi-refresh"
              [outlined]="true"
              (onClick)="loadTrips()"
            />
          </div>
        } @else if (trips().length === 0) {
          <div
            class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900"
          >
            <i class="pi pi-inbox text-3xl text-neutral-400"></i>
            <p class="mt-4 text-lg font-semibold">No trips found</p>
            <p class="mt-2 text-neutral-500 dark:text-neutral-400">
              Try another date or route combination.
            </p>
            <p-button class="mt-6" label="Back to search" routerLink="/" />
          </div>
        } @else {
          <div class="grid gap-4">
            @for (trip of trips(); track trip._id) {
              <article
                class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6"
              >
                <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <p-tag
                        [value]="companyName(trip.company)"
                        severity="secondary"
                        [rounded]="true"
                      />
                      @if (isPopulatedBus(trip.bus)) {
                        <span class="text-sm text-neutral-500 dark:text-neutral-400">
                          {{ trip.bus.busType }} · {{ trip.bus.plateNumber }}
                        </span>
                      }
                    </div>

                    <div class="mt-3 flex flex-wrap items-center gap-4 text-lg font-semibold">
                      <span>{{ formatTime(trip.departureTime) }}</span>
                      <i class="pi pi-arrow-right text-sm text-neutral-400"></i>
                      <span>{{ formatTime(trip.arrivalTime) }}</span>
                    </div>

                    @if (isPopulatedRoute(trip.route)) {
                      <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {{ trip.route.originStation }} → {{ trip.route.destinationStation }}
                      </p>
                    }

                    <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      {{ trip.availableSeats }} seats left
                    </p>
                  </div>

                  <div
                    class="flex items-center justify-between gap-4 border-t border-neutral-200 pt-4 lg:border-t-0 lg:pt-0 lg:text-right dark:border-neutral-800"
                  >
                    <div>
                      <p class="text-2xl font-bold text-teal-600 dark:text-teal-400">
                        {{ formatCurrency(trip.pricePerSeat) }}
                      </p>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">per seat</p>
                    </div>
                    <p-button
                      label="Select seats"
                      icon="pi pi-ticket"
                      [disabled]="trip.availableSeats < passengers()"
                      (onClick)="selectTrip(trip)"
                    />
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class SearchComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CustomerCatalogService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly trips = signal<Trip[]>([]);
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly date = signal<Date | null>(null);
  protected readonly passengers = signal(1);

  protected readonly formatDate = formatDate;
  protected readonly formatTime = formatTime;
  protected readonly formatCurrency = formatCurrency;
  protected readonly companyName = companyName;
  protected readonly isPopulatedBus = isPopulatedBus;
  protected readonly isPopulatedRoute = isPopulatedRoute;

  constructor() {
    this.route.queryParamMap.subscribe(() => this.loadTrips());
  }

  protected loadTrips(): void {
    const from = this.route.snapshot.queryParamMap.get('from') ?? '';
    const to = this.route.snapshot.queryParamMap.get('to') ?? '';
    const dateParam = this.route.snapshot.queryParamMap.get('date') ?? '';
    const passengers = Number(this.route.snapshot.queryParamMap.get('passengers') ?? '1');
    const parsedDate = parseIsoDate(dateParam);

    this.from.set(from);
    this.to.set(to);
    this.date.set(parsedDate);
    this.passengers.set(Number.isFinite(passengers) && passengers > 0 ? passengers : 1);

    if (!from || !to || !parsedDate) {
      this.loading.set(false);
      this.error.set('Missing search details. Please search again from the home page.');
      this.trips.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.catalog.searchTrips(from, to, parsedDate, this.passengers()).subscribe({
      next: (trips) => {
        this.trips.set(trips);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          'Unable to reach the booking API. Make sure the backend is running on port 3000.',
        );
        this.trips.set([]);
        this.loading.set(false);
      },
    });
  }

  protected selectTrip(trip: Trip): void {
    this.router.navigate(['/book', trip._id], {
      queryParams: {
        passengers: this.passengers(),
        from: this.from(),
        to: this.to(),
        date: this.route.snapshot.queryParamMap.get('date'),
      },
    });
  }
}
