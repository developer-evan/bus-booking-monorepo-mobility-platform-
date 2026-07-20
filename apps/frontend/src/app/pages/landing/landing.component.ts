import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { LandingFooterComponent } from '../../layout/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../../layout/landing-header/landing-header.component';

interface CityOption {
  label: string;
  value: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
}

interface RouteCard {
  from: string;
  to: string;
  duration: string;
  price: string;
  frequency: string;
}

@Component({
  selector: 'app-landing',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Button,
    DatePicker,
    Select,
    Tag,
    LandingHeaderComponent,
    LandingFooterComponent,
  ],
  template: `
    <div class="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <app-landing-header />

      <main>
        <!-- Hero -->
        <section class="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div
            class="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-12 lg:py-16"
          >
            <div class="max-w-xl">
              <p-tag value="Now serving 45+ operators" severity="secondary" [rounded]="true" />
              <h1
                class="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]"
              >
                Bus travel, booked the modern way
              </h1>
              <p class="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Find routes, compare prices, and secure your seat online. No queues,
                no guesswork — just a clean booking experience from search to boarding.
              </p>
            </div>

            <div
              class="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-950"
              [formGroup]="searchForm"
            >
              <h2 class="text-lg font-semibold">Find your next trip</h2>
              <p class="mt-1.5 text-[0.9375rem] text-neutral-500 dark:text-neutral-400">
                Search departures across Kenya
              </p>

              <div
                class="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] lg:grid-cols-[1fr_auto_1fr_1fr_1fr_auto] lg:items-end"
              >
                <div class="flex flex-col gap-1.5">
                  <label for="from" class="text-[0.8125rem] font-semibold text-neutral-500 dark:text-neutral-400"
                    >From</label
                  >
                  <p-select
                    inputId="from"
                    formControlName="from"
                    [options]="cities"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select city"
                    styleClass="w-full"
                  />
                </div>

                <div class="flex items-center justify-center sm:pt-6 lg:mb-1 lg:pt-0">
                  <p-button
                    icon="pi pi-arrow-right-arrow-left"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    ariaLabel="Swap origin and destination"
                    (onClick)="swapLocations()"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label for="to" class="text-[0.8125rem] font-semibold text-neutral-500 dark:text-neutral-400"
                    >To</label
                  >
                  <p-select
                    inputId="to"
                    formControlName="to"
                    [options]="cities"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select city"
                    styleClass="w-full"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label for="date" class="text-[0.8125rem] font-semibold text-neutral-500 dark:text-neutral-400"
                    >Travel date</label
                  >
                  <p-datepicker
                    inputId="date"
                    formControlName="date"
                    [showIcon]="true"
                    [minDate]="minDate"
                    dateFormat="D, M d"
                    styleClass="w-full"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label
                    for="passengers"
                    class="text-[0.8125rem] font-semibold text-neutral-500 dark:text-neutral-400"
                    >Passengers</label
                  >
                  <p-select
                    inputId="passengers"
                    formControlName="passengers"
                    [options]="passengerOptions"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="w-full"
                  />
                </div>

                <div class="sm:col-span-full lg:col-span-1 lg:min-w-36">
                  <p-button
                    label="Search trips"
                    icon="pi pi-search"
                    styleClass="w-full"
                    (onClick)="searchTrips()"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Stats -->
        <section
          class="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
          aria-label="Platform statistics"
        >
          <div class="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-7 sm:grid-cols-4">
            @for (stat of stats; track stat.label) {
              <div class="flex flex-col gap-1">
                <span class="text-3xl font-bold tracking-tight text-teal-600 dark:text-teal-400">{{
                  stat.value
                }}</span>
                <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ stat.label }}</span>
              </div>
            }
          </div>
        </section>

        <!-- How it works -->
        <section class="py-16" id="how-it-works">
          <div class="mx-auto max-w-6xl px-6">
            <div class="mb-10 max-w-xl">
              <p-tag value="How it works" severity="secondary" [rounded]="true" />
              <h2 class="mt-3.5 text-3xl font-bold tracking-tight lg:text-4xl">
                Three steps to your seat
              </h2>
              <p class="mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
                A straightforward flow designed for first-time and frequent travelers alike.
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              @for (step of steps; track step.number) {
                <article
                  class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <span class="text-[0.8125rem] font-bold tracking-wider text-teal-600 dark:text-teal-400">{{
                    step.number
                  }}</span>
                  <h3 class="mt-3 text-lg font-semibold">{{ step.title }}</h3>
                  <p class="mt-2 text-[0.9375rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {{ step.description }}
                  </p>
                </article>
              }
            </div>
          </div>
        </section>

        <!-- Features -->
        <section
          class="border-y border-neutral-200 bg-white py-16 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="mx-auto max-w-6xl px-6">
            <div class="mb-10 max-w-xl">
              <p-tag value="Why BusBook" severity="secondary" [rounded]="true" />
              <h2 class="mt-3.5 text-3xl font-bold tracking-tight lg:text-4xl">
                Built for clarity and confidence
              </h2>
              <p class="mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
                Everything you need for stress-free intercity travel, without the clutter.
              </p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              @for (feature of features; track feature.title) {
                <article
                  class="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <span
                    class="inline-flex size-10 items-center justify-center rounded-lg border border-neutral-200 text-base text-teal-600 dark:border-neutral-800 dark:text-teal-400"
                    aria-hidden="true"
                  >
                    <i [class]="feature.icon"></i>
                  </span>
                  <h3 class="mt-4 text-[1.0625rem] font-semibold">{{ feature.title }}</h3>
                  <p class="mt-2 text-[0.9375rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {{ feature.description }}
                  </p>
                </article>
              }
            </div>
          </div>
        </section>

        <!-- Popular routes -->
        <section class="py-16" id="routes">
          <div class="mx-auto max-w-6xl px-6">
            <div class="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div class="max-w-xl">
                <p-tag value="Popular routes" severity="secondary" [rounded]="true" />
                <h2 class="mt-3.5 text-3xl font-bold tracking-tight lg:text-4xl">
                  Trending journeys this week
                </h2>
                <p class="mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
                  High-demand corridors with frequent departures and competitive fares.
                </p>
              </div>
              <p-button label="View all routes" [outlined]="true" severity="secondary" />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              @for (route of popularRoutes; track route.from + route.to) {
                <article
                  class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6"
                >
                  <div class="flex items-center gap-2.5 text-[1.0625rem] font-semibold">
                    <span>{{ route.from }}</span>
                    <i class="pi pi-arrow-right text-xs text-neutral-400" aria-hidden="true"></i>
                    <span>{{ route.to }}</span>
                  </div>
                  <div class="mt-2.5 flex flex-wrap gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <span class="inline-flex items-center gap-1.5">
                      <i class="pi pi-clock"></i> {{ route.duration }}
                    </span>
                    <span class="inline-flex items-center gap-1.5">
                      <i class="pi pi-sync"></i> {{ route.frequency }}
                    </span>
                  </div>
                  <div
                    class="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800"
                  >
                    <span class="text-[0.9375rem] font-semibold text-teal-600 dark:text-teal-400">
                      from {{ route.price }}
                    </span>
                    <p-button label="Book" [text]="true" />
                  </div>
                </article>
              }
            </div>
          </div>
        </section>

        <!-- Operator CTA -->
        <section class="pb-20 pt-4" id="operators">
          <div class="mx-auto max-w-6xl px-6">
            <div
              class="flex flex-col gap-6 rounded-xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900 lg:flex-row lg:items-center lg:justify-between lg:p-10"
            >
              <div class="max-w-xl">
                <p-tag value="For operators" severity="secondary" [rounded]="true" />
                <h2 class="mt-3.5 text-2xl font-bold tracking-tight lg:text-3xl">
                  Grow your fleet with BusBook
                </h2>
                <p class="mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
                  List routes, manage bookings, and reach more passengers through a
                  single operator portal. Onboarding takes less than a day.
                </p>
              </div>
              <div class="flex flex-wrap gap-3">
                <p-button label="Operator portal" icon="pi pi-building" routerLink="/portal" />
                <p-button
                  label="Talk to our team"
                  icon="pi pi-envelope"
                  [outlined]="true"
                  severity="secondary"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <app-landing-footer />
    </div>
  `,
})
export class LandingComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly minDate = new Date();

  protected readonly searchForm = this.fb.group({
    from: ['Nairobi', Validators.required],
    to: ['Mombasa', Validators.required],
    date: [new Date(), Validators.required],
    passengers: [1, Validators.required],
  });

  protected readonly cities: CityOption[] = [
    { label: 'Nairobi', value: 'Nairobi' },
    { label: 'Mombasa', value: 'Mombasa' },
    { label: 'Kisumu', value: 'Kisumu' },
    { label: 'Nakuru', value: 'Nakuru' },
    { label: 'Eldoret', value: 'Eldoret' },
    { label: 'Malindi', value: 'Malindi' },
  ];

  protected readonly passengerOptions = [
    { label: '1 passenger', value: 1 },
    { label: '2 passengers', value: 2 },
    { label: '3 passengers', value: 3 },
    { label: '4 passengers', value: 4 },
    { label: '5+ passengers', value: 5 },
  ];

  protected readonly stats = [
    { value: '120+', label: 'Daily routes' },
    { value: '45', label: 'Partner operators' },
    { value: '18k', label: 'Tickets booked monthly' },
    { value: '4.8', label: 'Average rating' },
  ];

  protected readonly features: Feature[] = [
    {
      icon: 'pi pi-search',
      title: 'Search in seconds',
      description:
        'Compare departures, prices, and seat availability across operators on one screen.',
    },
    {
      icon: 'pi pi-ticket',
      title: 'Instant digital tickets',
      description:
        'Receive your ticket immediately. Show your booking reference or QR code at boarding.',
    },
    {
      icon: 'pi pi-shield',
      title: 'Trusted operators',
      description:
        'Every partner is verified. Travel with confidence on licensed, insured fleets.',
    },
    {
      icon: 'pi pi-headphones',
      title: 'Support when you need it',
      description:
        'Real people ready to help with changes, refunds, and trip questions around the clock.',
    },
  ];

  protected readonly steps: Step[] = [
    {
      number: '01',
      title: 'Choose your route',
      description: 'Pick origin, destination, and travel date to see available trips.',
    },
    {
      number: '02',
      title: 'Select seats & pay',
      description: 'Reserve your seat securely and pay with mobile money or card.',
    },
    {
      number: '03',
      title: 'Board with ease',
      description: 'Arrive at the terminal, show your ticket, and start your journey.',
    },
  ];

  protected readonly popularRoutes: RouteCard[] = [
    {
      from: 'Nairobi',
      to: 'Mombasa',
      duration: '8h 30m',
      price: 'KES 1,500',
      frequency: 'Every hour',
    },
    {
      from: 'Nairobi',
      to: 'Kisumu',
      duration: '6h 15m',
      price: 'KES 1,200',
      frequency: '12 daily',
    },
    {
      from: 'Nairobi',
      to: 'Nakuru',
      duration: '2h 45m',
      price: 'KES 600',
      frequency: '18 daily',
    },
    {
      from: 'Mombasa',
      to: 'Malindi',
      duration: '2h 10m',
      price: 'KES 450',
      frequency: '8 daily',
    },
  ];

  protected swapLocations(): void {
    const from = this.searchForm.get('from')?.value;
    const to = this.searchForm.get('to')?.value;
    this.searchForm.patchValue({ from: to, to: from });
  }

  protected searchTrips(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }
  }
}
