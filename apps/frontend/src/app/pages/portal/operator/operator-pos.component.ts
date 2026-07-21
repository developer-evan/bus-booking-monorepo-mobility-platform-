import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { occupiedSeatsFromBookings } from '../../../core/models/booking.model';
import { Trip } from '../../../core/models/trip.model';
import { AuthService } from '../../../core/services/auth.service';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { TripsApiService } from '../../../core/services/trips-api.service';
import { extractApiErrorMessage, generateSeatLabels } from '../../../core/utils/auth.util';
import {
  dayRangeIso,
  formatCurrency,
  formatTime,
  isPopulatedBus,
  isPopulatedRoute,
} from '../../../core/utils/format.util';

@Component({
  selector: 'app-operator-pos',
  imports: [ReactiveFormsModule, Button, InputText, Tag],
  template: `
    @if (loadingTrips()) {
      <div class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
      </div>
    } @else if (loadError()) {
      <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        {{ loadError() }}
      </div>
    } @else {
      <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
          <h2 class="text-lg font-semibold">Select trip</h2>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Choose a departure for this walk-in booking.
          </p>

          <div class="mt-4 grid max-h-[28rem] gap-2 overflow-y-auto">
            @for (trip of trips(); track trip._id) {
              <button
                type="button"
                class="rounded-lg border px-4 py-3 text-left transition-colors"
                [class.border-teal-600]="selectedTripId() === trip._id"
                [class.bg-teal-50]="selectedTripId() === trip._id"
                [class.dark:border-teal-500]="selectedTripId() === trip._id"
                [class.dark:bg-teal-950/30]="selectedTripId() === trip._id"
                [class.border-neutral-200]="selectedTripId() !== trip._id"
                [class.dark:border-neutral-800]="selectedTripId() !== trip._id"
                (click)="selectTrip(trip)"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="font-semibold">
                    {{ formatTime(trip.departureTime) }} → {{ formatTime(trip.arrivalTime) }}
                  </span>
                  <p-tag [value]="trip.status" [rounded]="true" />
                </div>
                @if (isPopulatedRoute(trip.route)) {
                  <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {{ trip.route.origin }} → {{ trip.route.destination }}
                  </p>
                }
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {{ trip.availableSeats }} seats left · {{ formatCurrency(trip.pricePerSeat) }} each
                </p>
              </button>
            }
          </div>
        </section>

        <section class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
          @if (!selectedTrip()) {
            <div class="py-16 text-center text-neutral-500 dark:text-neutral-400">
              <i class="pi pi-ticket text-3xl"></i>
              <p class="mt-4">Select a trip to continue</p>
            </div>
          } @else {
            <h2 class="text-lg font-semibold">Passenger & seats</h2>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Cash payment is recorded automatically when the booking is created.
            </p>

            <form class="mt-5 grid gap-4" [formGroup]="posForm" (ngSubmit)="submitPos()">
              <input
                pInputText
                formControlName="passengerName"
                class="w-full"
                placeholder="Passenger full name"
              />
              <input
                pInputText
                formControlName="passengerPhone"
                class="w-full"
                placeholder="Passenger phone"
              />
              <input
                pInputText
                type="email"
                formControlName="passengerEmail"
                class="w-full"
                placeholder="Passenger email (optional if phone provided)"
              />

              <div>
                <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">Seat map</p>
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Selected: {{ selectedSeats().join(', ') || 'None' }}
                </p>
                <div class="mt-3 grid grid-cols-4 gap-2">
                  @for (seat of seatLabels(); track seat) {
                    <button
                      type="button"
                      class="rounded-lg border px-2 py-2 text-sm font-medium transition-colors"
                      [disabled]="occupiedSeats().includes(seat)"
                      [class.border-teal-600]="selectedSeats().includes(seat)"
                      [class.bg-teal-600]="selectedSeats().includes(seat)"
                      [class.text-white]="selectedSeats().includes(seat)"
                      [class.border-neutral-200]="!selectedSeats().includes(seat) && !occupiedSeats().includes(seat)"
                      [class.bg-white]="!selectedSeats().includes(seat) && !occupiedSeats().includes(seat)"
                      [class.opacity-40]="occupiedSeats().includes(seat)"
                      [class.dark:border-neutral-800]="!selectedSeats().includes(seat)"
                      [class.dark:bg-neutral-900]="!selectedSeats().includes(seat)"
                      (click)="toggleSeat(seat)"
                    >
                      {{ seat }}
                    </button>
                  }
                </div>
              </div>

              <div class="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                <div class="flex items-center justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">Total (cash)</span>
                  <span class="text-xl font-bold text-teal-600 dark:text-teal-400">
                    {{ formatCurrency(totalPrice()) }}
                  </span>
                </div>
              </div>

              @if (submitError()) {
                <p class="text-sm text-red-600 dark:text-red-400">{{ submitError() }}</p>
              }

              <p-button
                type="submit"
                label="Create POS booking"
                icon="pi pi-check"
                [loading]="submitting()"
                [disabled]="posForm.invalid || selectedSeats().length === 0"
              />
            </form>

            @if (lastBookingRef()) {
              <div
                class="mt-6 rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/30"
              >
                <p class="font-medium text-teal-800 dark:text-teal-200">Booking confirmed</p>
                <p class="mt-2 font-mono text-lg tracking-wide text-teal-900 dark:text-teal-100">
                  {{ lastBookingRef() }}
                </p>
              </div>
            }
          }
        </section>
      </div>
    }
  `,
})
export class OperatorPosComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly bookingsApi = inject(BookingsApiService);

  protected readonly loadingTrips = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly trips = signal<Trip[]>([]);
  protected readonly selectedTripId = signal<string | null>(null);
  protected readonly selectedTrip = signal<Trip | null>(null);
  protected readonly seatLabels = signal<string[]>([]);
  protected readonly occupiedSeats = signal<string[]>([]);
  protected readonly selectedSeats = signal<string[]>([]);
  protected readonly lastBookingRef = signal<string | null>(null);

  protected readonly posForm = this.fb.nonNullable.group({
    passengerName: ['', Validators.required],
    passengerPhone: [''],
    passengerEmail: [''],
  });

  protected readonly formatTime = formatTime;
  protected readonly formatCurrency = formatCurrency;
  protected readonly isPopulatedRoute = isPopulatedRoute;

  ngOnInit(): void {
    const companyId = this.auth.user()?.company;
    if (!companyId) {
      this.loadError.set('Your account is not linked to a company.');
      this.loadingTrips.set(false);
      return;
    }

    const range = dayRangeIso(new Date());
    const preselectedTripId = this.route.snapshot.queryParamMap.get('tripId');

    this.tripsApi
      .search({
        company: companyId,
        departureFrom: range.departureFrom,
      })
      .subscribe({
        next: (trips) => {
          const bookableTrips = trips.filter((trip) =>
            ['scheduled', 'boarding'].includes(trip.status),
          );
          this.trips.set(
            bookableTrips.sort(
              (a, b) =>
                new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
            ),
          );
          this.loadingTrips.set(false);

          if (preselectedTripId) {
            const trip = bookableTrips.find((item) => item._id === preselectedTripId);
            if (trip) {
              this.selectTrip(trip);
            }
          }
        },
        error: (err) => {
          this.loadError.set(extractApiErrorMessage(err, 'Failed to load trips'));
          this.loadingTrips.set(false);
        },
      });
  }

  protected totalPrice(): number {
    const trip = this.selectedTrip();
    return trip ? trip.pricePerSeat * this.selectedSeats().length : 0;
  }

  protected selectTrip(trip: Trip): void {
    this.selectedTripId.set(trip._id);
    this.selectedTrip.set(trip);
    this.selectedSeats.set([]);
    this.submitError.set(null);
    this.lastBookingRef.set(null);

    const capacity = isPopulatedBus(trip.bus) ? trip.bus.seatCapacity : trip.availableSeats;
    this.seatLabels.set(generateSeatLabels(Math.max(capacity, 1)));

    this.bookingsApi.list({ trip: trip._id }).subscribe({
      next: (bookings) => this.occupiedSeats.set(occupiedSeatsFromBookings(bookings)),
      error: () => this.occupiedSeats.set([]),
    });
  }

  protected toggleSeat(seat: string): void {
    if (this.occupiedSeats().includes(seat)) {
      return;
    }

    const selected = this.selectedSeats();
    if (selected.includes(seat)) {
      this.selectedSeats.set(selected.filter((value) => value !== seat));
      return;
    }

    this.selectedSeats.set([...selected, seat]);
  }

  protected submitPos(): void {
    const trip = this.selectedTrip();
    const seats = this.selectedSeats();
    const { passengerName, passengerPhone, passengerEmail } = this.posForm.getRawValue();

    if (!trip || seats.length === 0 || this.posForm.invalid) {
      return;
    }

    if (!passengerPhone && !passengerEmail) {
      this.submitError.set('Provide a passenger phone or email.');
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    this.lastBookingRef.set(null);

    this.bookingsApi
      .createPos({
        trip: trip._id,
        seatNumbers: seats,
        passengerName,
        passengerPhone: passengerPhone || undefined,
        passengerEmail: passengerEmail || undefined,
      })
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.lastBookingRef.set(result.booking.bookingReference);
          this.posForm.reset();
          this.selectedSeats.set([]);
          this.selectTrip(trip);
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(extractApiErrorMessage(err, 'POS booking failed'));
        },
      });
  }
}
