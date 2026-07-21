import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Booking } from '../../core/models/booking.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingsApiService } from '../../core/services/bookings-api.service';
import { extractApiErrorMessage } from '../../core/utils/auth.util';
import { formatCurrency, formatDate, formatTime } from '../../core/utils/format.util';
import { portalNavItemsForRole } from '../../core/models/portal-nav.model';
import { PortalShellComponent } from '../../layout/portal-shell/portal-shell.component';

@Component({
  selector: 'app-customer-portal',
  imports: [RouterLink, Button, Tag, PortalShellComponent],
  template: `
    <app-portal-shell
      title="My bookings"
      subtitle="View and manage your trip reservations"
      portalLabel="Customer Portal"
      [navItems]="navItems"
    >
      @if (successMessage()) {
        <div
          class="mb-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200"
        >
          Booking confirmed · reference <span class="font-mono">{{ successMessage() }}</span>
        </div>
      }

      <div class="mb-6 flex flex-wrap gap-3">
        <p-button label="Search trips" icon="pi pi-search" routerLink="/" />
      </div>

      @if (loading()) {
        <div class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
        </div>
      } @else if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {{ error() }}
        </div>
      } @else if (bookings().length === 0) {
        <div class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-neutral-500 dark:text-neutral-400">You have no bookings yet.</p>
          <p-button class="mt-4" label="Find a trip" routerLink="/" />
        </div>
      } @else {
        <div class="grid gap-4">
          @for (booking of bookings(); track booking._id) {
            <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <p-tag [value]="booking.status" [rounded]="true" />
                    <span class="font-mono text-sm text-neutral-500 dark:text-neutral-400">{{
                      booking.bookingReference
                    }}</span>
                  </div>
                  <p class="mt-3 text-lg font-semibold">
                    Seats: {{ booking.seatNumbers.join(', ') }}
                  </p>
                  <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {{ booking.passengerCount }} passenger{{ booking.passengerCount === 1 ? '' : 's' }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xl font-bold text-teal-600 dark:text-teal-400">
                    {{ formatCurrency(booking.totalPrice) }}
                  </p>
                  @if (booking.createdAt) {
                    <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      Booked {{ formatDate(booking.createdAt) }}
                    </p>
                  }
                </div>
              </div>

              @if (booking.status === 'pending' || booking.status === 'confirmed') {
                <div class="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <p-button
                    label="Cancel booking"
                    icon="pi pi-times"
                    severity="danger"
                    [text]="true"
                    [loading]="cancellingId() === booking._id"
                    (onClick)="cancelBooking(booking)"
                  />
                </div>
              }
            </article>
          }
        </div>
      }
    </app-portal-shell>
  `,
})
export class CustomerPortalComponent implements OnInit {
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly navItems = portalNavItemsForRole('customer');

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly bookings = signal<Booking[]>([]);
  protected readonly cancellingId = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly formatTime = formatTime;

  ngOnInit(): void {
    const booked = this.route.snapshot.queryParamMap.get('booked');
    if (booked) {
      this.successMessage.set(booked);
    }
    this.loadBookings();
  }

  protected loadBookings(): void {
    this.loading.set(true);
    this.error.set(null);

    this.bookingsApi.listMine().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractApiErrorMessage(err, 'Failed to load bookings'));
        this.loading.set(false);
      },
    });
  }

  protected cancelBooking(booking: Booking): void {
    this.cancellingId.set(booking._id);
    this.bookingsApi.cancel(booking._id).subscribe({
      next: (updated) => {
        this.bookings.update((items) =>
          items.map((item) => (item._id === updated._id ? updated : item)),
        );
        this.cancellingId.set(null);
      },
      error: (err) => {
        this.error.set(extractApiErrorMessage(err, 'Could not cancel booking'));
        this.cancellingId.set(null);
      },
    });
  }
}
