import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Company } from '../../../core/models/company.model';
import { Trip } from '../../../core/models/trip.model';
import { AuthService } from '../../../core/services/auth.service';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { CompaniesApiService } from '../../../core/services/companies-api.service';
import { TripsApiService } from '../../../core/services/trips-api.service';
import { extractApiErrorMessage } from '../../../core/utils/auth.util';
import { dayRangeIso, formatDate, formatTime, isPopulatedRoute } from '../../../core/utils/format.util';

@Component({
  selector: 'app-admin-dashboard',
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
    } @else if (company(); as currentCompany) {
      <section
        class="overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-lg shadow-teal-900/20 dark:border-teal-900 sm:p-8"
      >
        <p class="text-sm font-medium text-teal-100">Welcome back</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{{ currentCompany.name }}</h2>
        <p class="mt-2 max-w-2xl text-sm text-teal-50">
          Manage your fleet operations, onboard operators, and monitor today's departures from one place.
        </p>
        <div class="mt-5 flex flex-wrap gap-2">
          <p-tag [value]="currentCompany.status" severity="success" [rounded]="true" />
          <span class="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{{ currentCompany.slug }}</span>
        </div>
      </section>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Today's trips</p>
          <p class="mt-2 text-3xl font-bold">{{ todayTrips().length }}</p>
        </article>
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Confirmed bookings</p>
          <p class="mt-2 text-3xl font-bold">{{ confirmedBookings() }}</p>
        </article>
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Company status</p>
          <p class="mt-2 text-3xl font-bold capitalize">{{ currentCompany.status }}</p>
        </article>
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Seats available today</p>
          <p class="mt-2 text-3xl font-bold">{{ seatsAvailableToday() }}</p>
        </article>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-3">
        <a
          routerLink="/portal/admin/company"
          class="rounded-xl border border-neutral-200 bg-white p-5 no-underline transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-none"
        >
          <span class="inline-flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
            <i class="pi pi-building"></i>
          </span>
          <p class="mt-4 font-semibold text-neutral-900 dark:text-neutral-50">Company profile</p>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">View contact details and account status</p>
        </a>
        <a
          routerLink="/portal/admin/team"
          class="rounded-xl border border-neutral-200 bg-white p-5 no-underline transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-none"
        >
          <span class="inline-flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
            <i class="pi pi-users"></i>
          </span>
          <p class="mt-4 font-semibold text-neutral-900 dark:text-neutral-50">Invite operators</p>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Send invites for terminal and POS staff</p>
        </a>
        <div class="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 dark:border-neutral-700 dark:bg-neutral-950/40">
          <span class="inline-flex size-10 items-center justify-center rounded-lg bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <i class="pi pi-calendar"></i>
          </span>
          <p class="mt-4 font-semibold text-neutral-700 dark:text-neutral-200">Routes & trips</p>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Scheduling tools coming in the next release</p>
        </div>
      </div>

      <section class="mt-8 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div>
            <h3 class="text-lg font-semibold">Today's departures</h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ formatDate(today) }}</p>
          </div>
          <p-button label="View company" [text]="true" routerLink="/portal/admin/company" />
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
                </div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ trip.availableSeats }} seats left</p>
              </div>
            }
          </div>
        }
      </section>
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly companiesApi = inject(CompaniesApiService);
  private readonly tripsApi = inject(TripsApiService);
  private readonly bookingsApi = inject(BookingsApiService);

  protected readonly today = new Date();
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly company = signal<Company | null>(null);
  protected readonly todayTrips = signal<Trip[]>([]);
  protected readonly confirmedBookings = signal(0);

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

    this.companiesApi.getById(companyId).subscribe({
      next: (company) => this.company.set(company),
      error: (err) => this.error.set(extractApiErrorMessage(err, 'Failed to load company')),
    });

    const range = dayRangeIso(this.today);
    this.tripsApi
      .search({ company: companyId, departureFrom: range.departureFrom, departureTo: range.departureTo })
      .subscribe({
        next: (trips) => {
          this.todayTrips.set(
            trips.sort(
              (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
            ),
          );
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to load dashboard'));
          this.loading.set(false);
        },
      });

    this.bookingsApi.list({ status: 'confirmed' }).subscribe({
      next: (bookings) => this.confirmedBookings.set(bookings.length),
      error: () => this.confirmedBookings.set(0),
    });
  }

  protected seatsAvailableToday(): number {
    return this.todayTrips().reduce((total, trip) => total + trip.availableSeats, 0);
  }
}
