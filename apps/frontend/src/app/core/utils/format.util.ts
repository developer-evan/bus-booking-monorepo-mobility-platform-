import { BusRoute } from '../models/route.model';

export function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function addDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

export function toIsoDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dayRangeIso(date: Date): { departureFrom: string; departureTo: string } {
  return {
    departureFrom: startOfDay(date).toISOString(),
    departureTo: endOfDay(date).toISOString(),
  };
}

export function formatTime(value: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

export function formatCurrency(amount: number, currency = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function companyName(
  company: { name: string } | string | null | undefined,
): string {
  if (!company || typeof company === 'string') {
    return 'Operator';
  }

  return company.name;
}

export function isPopulatedRoute(
  route: BusRoute | string | null | undefined,
): route is BusRoute {
  return !!route && typeof route === 'object' && 'origin' in route;
}

export function isPopulatedBus(
  bus: { plateNumber?: string; busType?: string } | string | null | undefined,
): bus is { plateNumber: string; busType: string; seatCapacity: number } {
  return !!bus && typeof bus === 'object' && 'plateNumber' in bus;
}
