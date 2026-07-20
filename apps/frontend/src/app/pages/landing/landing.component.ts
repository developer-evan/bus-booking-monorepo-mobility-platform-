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
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
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
