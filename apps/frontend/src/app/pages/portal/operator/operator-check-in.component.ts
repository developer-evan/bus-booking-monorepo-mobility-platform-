import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Booking, passengerLabel, tripIdFromBooking } from '../../../core/models/booking.model';
import { Trip } from '../../../core/models/trip.model';
import { AuthService } from '../../../core/services/auth.service';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { TripsApiService } from '../../../core/services/trips-api.service';
import { extractApiErrorMessage } from '../../../core/utils/auth.util';
import {
  formatCurrency,
  formatDate,
  formatTime,
  isPopulatedRoute,
} from '../../../core/utils/format.util';

@Component({
  selector: 'app-operator-check-in',
  imports: [ReactiveFormsModule, Button, InputText, Tag],
  template: `
    <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
        <h2 class="text-lg font-semibold">Find booking</h2>
        <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Search by booking reference and passenger contact.
        </p>

        <form class="mt-5 grid gap-3" [formGroup]="lookupForm" (ngSubmit)="lookupBooking()">
          <input
            pInputText
            formControlName="reference"
            class="w-full font-mono uppercase"
            placeholder="Booking reference (BB-XXXXXX)"
          />
          <input
            pInputText
            formControlName="phone"
            class="w-full"
            placeholder="Passenger phone"
          />
          <input
            pInputText
            type="email"
            formControlName="email"
            class="w-full"
            placeholder="Passenger email"
          />

          @if (lookupError()) {
            <p class="text-sm text-red-600 dark:text-red-400">{{ lookupError() }}</p>
          }

          <p-button
            type="submit"
            label="Find booking"
            icon="pi pi-search"
            [loading]="lookingUp()"
            [disabled]="lookupForm.invalid"
          />
        </form>
      </section>

      <section class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
        @if (!foundBooking()) {
          <div class="py-16 text-center text-neutral-500 dark:text-neutral-400">
            <i class="pi pi-id-card text-3xl"></i>
            <p class="mt-4">Look up a booking to check in a passenger</p>
          </div>
        } @else if (foundBooking(); as booking) {
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-mono text-lg font-semibold">{{ booking.bookingReference }}</p>
              <p class="mt-1 text-neutral-600 dark:text-neutral-300">{{ passengerLabel(booking) }}</p>
            </div>
            <p-tag [value]="booking.status" [rounded]="true" />
          </div>

          <dl class="mt-6 grid gap-3 text-sm">
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Seats</dt>
              <dd class="font-medium">{{ booking.seatNumbers.join(', ') }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Passengers</dt>
              <dd class="font-medium">{{ booking.passengerCount }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Total paid</dt>
              <dd class="font-medium">{{ formatCurrency(booking.totalPrice) }}</dd>
            </div>
            @if (booking.passengerPhone) {
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Phone</dt>
                <dd class="font-medium">{{ booking.passengerPhone }}</dd>
              </div>
            }
            @if (booking.passengerEmail) {
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Email</dt>
                <dd class="font-medium">{{ booking.passengerEmail }}</dd>
              </div>
            }
          </dl>

          @if (tripDetails(booking); as trip) {
            <div class="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <p class="text-sm font-semibold">Trip</p>
              <p class="mt-1">
                {{ formatDate(trip.departureTime) }} · {{ formatTime(trip.departureTime) }}
              </p>
              @if (isPopulatedRoute(trip.route)) {
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {{ trip.route.origin }} → {{ trip.route.destination }}
                </p>
              }
            </div>
          }

          @if (checkInError()) {
            <p class="mt-4 text-sm text-red-600 dark:text-red-400">{{ checkInError() }}</p>
          }

          @if (checkInSuccess()) {
            <p class="mt-4 text-sm text-teal-700 dark:text-teal-300">{{ checkInSuccess() }}</p>
          }

          <div class="mt-6 flex flex-wrap gap-2">
            @if (booking.status === 'confirmed') {
              <p-button
                label="Check in passenger"
                icon="pi pi-check-circle"
                [loading]="checkingIn()"
                (onClick)="checkIn(booking)"
              />
            } @else if (booking.status === 'completed') {
              <p-tag value="Already checked in" severity="success" [rounded]="true" />
            } @else {
              <p-tag [value]="'Cannot check in while ' + booking.status" severity="warn" [rounded]="true" />
            }
          </div>
        }
      </section>
    </div>

    <section class="mt-6 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div class="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <h2 class="text-lg font-semibold">Trip manifest</h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Confirmed passengers for a selected departure.
        </p>
      </div>

      @if (loadingManifest()) {
        <div class="p-8 text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
        </div>
      } @else {
        <div class="grid gap-4 p-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div class="grid max-h-80 gap-2 overflow-y-auto">
            @for (trip of manifestTrips(); track trip._id) {
              <button
                type="button"
                class="rounded-lg border px-4 py-3 text-left transition-colors"
                [class.border-teal-600]="manifestTripId() === trip._id"
                [class.bg-teal-50]="manifestTripId() === trip._id"
                [class.dark:border-teal-500]="manifestTripId() === trip._id"
                [class.dark:bg-teal-950/30]="manifestTripId() === trip._id"
                [class.border-neutral-200]="manifestTripId() !== trip._id"
                [class.dark:border-neutral-800]="manifestTripId() !== trip._id"
                (click)="loadManifest(trip._id)"
              >
                <p class="font-semibold">{{ formatTime(trip.departureTime) }}</p>
                @if (isPopulatedRoute(trip.route)) {
                  <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {{ trip.route.origin }} → {{ trip.route.destination }}
                  </p>
                }
              </button>
            }
          </div>

          <div>
            @if (!manifestTripId()) {
              <p class="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Select a trip to view its passenger list.
              </p>
            } @else if (manifestBookings().length === 0) {
              <p class="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No confirmed bookings for this trip.
              </p>
            } @else {
              <div class="divide-y divide-neutral-200 dark:divide-neutral-800">
                @for (booking of manifestBookings(); track booking._id) {
                  <div class="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p class="font-medium">{{ passengerLabel(booking) }}</p>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        {{ booking.bookingReference }} · Seats {{ booking.seatNumbers.join(', ') }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <p-tag [value]="booking.status" [rounded]="true" />
                      @if (booking.status === 'confirmed') {
                        <p-button
                          label="Check in"
                          [text]="true"
                          icon="pi pi-check"
                          [loading]="checkingInId() === booking._id"
                          (onClick)="checkIn(booking)"
                        />
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class OperatorCheckInComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly tripsApi = inject(TripsApiService);

  protected readonly lookingUp = signal(false);
  protected readonly checkingIn = signal(false);
  protected readonly checkingInId = signal<string | null>(null);
  protected readonly loadingManifest = signal(true);
  protected readonly lookupError = signal<string | null>(null);
  protected readonly checkInError = signal<string | null>(null);
  protected readonly checkInSuccess = signal<string | null>(null);
  protected readonly foundBooking = signal<Booking | null>(null);
  protected readonly manifestTrips = signal<Trip[]>([]);
  protected readonly manifestTripId = signal<string | null>(null);
  protected readonly manifestBookings = signal<Booking[]>([]);

  protected readonly lookupForm = this.fb.nonNullable.group({
    reference: ['', Validators.required],
    phone: [''],
    email: [''],
  });

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly formatTime = formatTime;
  protected readonly isPopulatedRoute = isPopulatedRoute;
  protected readonly passengerLabel = passengerLabel;

  constructor() {
    const companyId = this.auth.user()?.company;
    if (!companyId) {
      this.loadingManifest.set(false);
      return;
    }

    this.tripsApi
      .search({
        company: companyId,
        departureFrom: new Date().toISOString(),
      })
      .subscribe({
        next: (trips) => {
          this.manifestTrips.set(
            trips
              .filter((trip) => ['scheduled', 'boarding', 'in_transit'].includes(trip.status))
              .sort(
                (a, b) =>
                  new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
              ),
          );
          this.loadingManifest.set(false);
        },
        error: () => this.loadingManifest.set(false),
      });
  }

  protected tripDetails(booking: Booking): Trip | null {
    return typeof booking.trip === 'string' ? null : booking.trip;
  }

  protected lookupBooking(): void {
    const { reference, phone, email } = this.lookupForm.getRawValue();

    if (!phone && !email) {
      this.lookupError.set('Provide a passenger phone or email.');
      return;
    }

    this.lookingUp.set(true);
    this.lookupError.set(null);
    this.checkInError.set(null);
    this.checkInSuccess.set(null);

    this.bookingsApi
      .lookup({
        reference: reference.trim(),
        phone: phone || undefined,
        email: email || undefined,
      })
      .subscribe({
        next: (booking) => {
          this.foundBooking.set(booking);
          this.lookingUp.set(false);
        },
        error: (err) => {
          this.lookupError.set(extractApiErrorMessage(err, 'Booking not found'));
          this.foundBooking.set(null);
          this.lookingUp.set(false);
        },
      });
  }

  protected loadManifest(tripId: string): void {
    this.manifestTripId.set(tripId);
    this.bookingsApi.list({ trip: tripId, status: 'confirmed' }).subscribe({
      next: (bookings) => this.manifestBookings.set(bookings),
      error: () => this.manifestBookings.set([]),
    });
  }

  protected checkIn(booking: Booking): void {
    this.checkingIn.set(true);
    this.checkingInId.set(booking._id);
    this.checkInError.set(null);
    this.checkInSuccess.set(null);

    this.bookingsApi.updateStatus(booking._id, 'completed').subscribe({
      next: (updated) => {
        this.checkingIn.set(false);
        this.checkingInId.set(null);
        this.checkInSuccess.set(`${passengerLabel(updated)} checked in successfully.`);

        if (this.foundBooking()?._id === updated._id) {
          this.foundBooking.set(updated);
        }

        this.manifestBookings.update((items) =>
          items.map((item) => (item._id === updated._id ? updated : item)),
        );

        const tripId = tripIdFromBooking(updated);
        if (this.manifestTripId() === tripId) {
          this.loadManifest(tripId);
        }
      },
      error: (err) => {
        this.checkingIn.set(false);
        this.checkingInId.set(null);
        this.checkInError.set(extractApiErrorMessage(err, 'Check-in failed'));
      },
    });
  }
}
