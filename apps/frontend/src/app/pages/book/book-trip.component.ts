import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Trip } from '../../core/models/trip.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingsApiService } from '../../core/services/bookings-api.service';
import { TripsApiService } from '../../core/services/trips-api.service';
import { extractApiErrorMessage, generateSeatLabels } from '../../core/utils/auth.util';
import {
  companyName,
  formatCurrency,
  formatDate,
  formatTime,
  isPopulatedBus,
  isPopulatedRoute,
} from '../../core/utils/format.util';
import { LandingHeaderComponent } from '../../layout/landing-header/landing-header.component';

@Component({
  selector: 'app-book-trip',
  imports: [RouterLink, Button, Tag, LandingHeaderComponent],
  template: `
    <div class="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <app-landing-header />

      <main class="mx-auto max-w-6xl px-6 py-10">
        @if (loading()) {
          <div class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
            <p class="mt-4 text-neutral-500 dark:text-neutral-400">Loading trip...</p>
          </div>
        } @else if (error()) {
          <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {{ error() }}
          </div>
        } @else if (trip(); as currentTrip) {
          <div class="mb-8">
            <p-button
              label="Back to results"
              icon="pi pi-arrow-left"
              [text]="true"
              severity="secondary"
              [routerLink]="['/search']"
              [queryParams]="searchQuery()"
            />
            <h1 class="mt-3 text-3xl font-bold tracking-tight">Select seats</h1>
            <p class="mt-2 text-neutral-500 dark:text-neutral-400">
              Choose {{ passengers() }} seat{{ passengers() === 1 ? '' : 's' }} for this trip
            </p>
          </div>

          <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <div class="flex flex-wrap items-center gap-2">
                <p-tag [value]="companyName(currentTrip.company)" severity="secondary" [rounded]="true" />
                @if (isPopulatedBus(currentTrip.bus)) {
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">
                    {{ currentTrip.bus.busType }} · {{ currentTrip.bus.plateNumber }}
                  </span>
                }
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-4 text-xl font-semibold">
                <span>{{ formatTime(currentTrip.departureTime) }}</span>
                <i class="pi pi-arrow-right text-sm text-neutral-400"></i>
                <span>{{ formatTime(currentTrip.arrivalTime) }}</span>
              </div>

              @if (isPopulatedRoute(currentTrip.route)) {
                <p class="mt-2 text-neutral-500 dark:text-neutral-400">
                  {{ currentTrip.route.origin }} → {{ currentTrip.route.destination }}
                </p>
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {{ currentTrip.route.originStation }} → {{ currentTrip.route.destinationStation }}
                </p>
              }

              <p class="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                {{ currentTrip.availableSeats }} seats remaining
              </p>
            </section>

            <section class="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-950">
              <h2 class="text-lg font-semibold">Seat map</h2>
              <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Selected: {{ selectedSeats().join(', ') || 'None' }}
              </p>

              <div class="mt-4 grid grid-cols-4 gap-2">
                @for (seat of seatLabels(); track seat) {
                  <button
                    type="button"
                    class="rounded-lg border px-2 py-2 text-sm font-medium transition-colors"
                    [class.border-teal-600]="selectedSeats().includes(seat)"
                    [class.bg-teal-600]="selectedSeats().includes(seat)"
                    [class.text-white]="selectedSeats().includes(seat)"
                    [class.border-neutral-200]="!selectedSeats().includes(seat)"
                    [class.bg-white]="!selectedSeats().includes(seat)"
                    [class.dark:border-neutral-800]="!selectedSeats().includes(seat)"
                    [class.dark:bg-neutral-900]="!selectedSeats().includes(seat)"
                    (click)="toggleSeat(seat)"
                  >
                    {{ seat }}
                  </button>
                }
              </div>

              @if (bookingError()) {
                <p class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {{ bookingError() }}
                </p>
              }

              <div class="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <div class="flex items-center justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">Total</span>
                  <span class="text-xl font-bold text-teal-600 dark:text-teal-400">
                    {{ formatCurrency(currentTrip.pricePerSeat * selectedSeats().length) }}
                  </span>
                </div>

                @if (!auth.isAuthenticated()) {
                  <p class="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                    Sign in or register to complete your booking.
                  </p>
                  <div class="mt-3 grid gap-2">
                    <p-button
                      label="Sign in to book"
                      icon="pi pi-sign-in"
                      styleClass="w-full"
                      [routerLink]="['/auth/login']"
                      [queryParams]="{ returnUrl: returnUrl() }"
                    />
                    <p-button
                      label="Create account"
                      [outlined]="true"
                      severity="secondary"
                      styleClass="w-full"
                      [routerLink]="['/auth/register']"
                      [queryParams]="{ returnUrl: returnUrl() }"
                    />
                  </div>
                } @else if (!auth.hasRole('customer')) {
                  <p class="mt-4 text-sm text-amber-700 dark:text-amber-300">
                    Online booking requires a customer account. Staff accounts cannot book here.
                  </p>
                } @else {
                  <p-button
                    class="mt-4 block w-full"
                    label="Confirm booking"
                    icon="pi pi-check"
                    styleClass="w-full"
                    [loading]="booking()"
                    [disabled]="selectedSeats().length !== passengers()"
                    (onClick)="confirmBooking()"
                  />
                }
              </div>
            </section>
          </div>
        }
      </main>
    </div>
  `,
})
export class BookTripComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripsApi = inject(TripsApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  protected readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly booking = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly bookingError = signal<string | null>(null);
  protected readonly trip = signal<Trip | null>(null);
  protected readonly seatLabels = signal<string[]>([]);
  protected readonly selectedSeats = signal<string[]>([]);
  protected readonly passengers = signal(1);

  protected readonly formatTime = formatTime;
  protected readonly formatDate = formatDate;
  protected readonly formatCurrency = formatCurrency;
  protected readonly companyName = companyName;
  protected readonly isPopulatedBus = isPopulatedBus;
  protected readonly isPopulatedRoute = isPopulatedRoute;

  ngOnInit(): void {
    const tripId = this.route.snapshot.paramMap.get('tripId');
    const passengers = Number(this.route.snapshot.queryParamMap.get('passengers') ?? '1');
    this.passengers.set(Number.isFinite(passengers) && passengers > 0 ? passengers : 1);

    if (!tripId) {
      this.error.set('Trip not found.');
      this.loading.set(false);
      return;
    }

    this.tripsApi.getById(tripId).subscribe({
      next: (trip) => {
        this.trip.set(trip);
        const capacity = isPopulatedBus(trip.bus) ? trip.bus.seatCapacity : trip.availableSeats;
        this.seatLabels.set(generateSeatLabels(Math.max(capacity, trip.availableSeats)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load trip details.');
        this.loading.set(false);
      },
    });
  }

  protected searchQuery(): Record<string, string | number> {
    const params = this.route.snapshot.queryParams;
    return {
      from: params['from'] ?? '',
      to: params['to'] ?? '',
      date: params['date'] ?? '',
      passengers: this.passengers(),
    };
  }

  protected returnUrl(): string {
    return this.router.url;
  }

  protected toggleSeat(seat: string): void {
    const selected = this.selectedSeats();
    const limit = this.passengers();

    if (selected.includes(seat)) {
      this.selectedSeats.set(selected.filter((value) => value !== seat));
      return;
    }

    if (selected.length >= limit) {
      this.selectedSeats.set([...selected.slice(1), seat]);
      return;
    }

    this.selectedSeats.set([...selected, seat]);
  }

  protected confirmBooking(): void {
    const currentTrip = this.trip();
    const seats = this.selectedSeats();

    if (!currentTrip || seats.length !== this.passengers()) {
      return;
    }

    this.booking.set(true);
    this.bookingError.set(null);

    this.bookingsApi
      .create({
        trip: currentTrip._id,
        seatNumbers: seats,
      })
      .subscribe({
        next: (booking) => {
          this.booking.set(false);
          void this.router.navigate(['/portal/customer'], {
            queryParams: { booked: booking.bookingReference },
          });
        },
        error: (err) => {
          this.booking.set(false);
          this.bookingError.set(extractApiErrorMessage(err, 'Booking failed'));
        },
      });
  }
}
