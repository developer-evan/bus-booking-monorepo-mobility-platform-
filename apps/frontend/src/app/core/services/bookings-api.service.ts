import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Booking,
  BookingListQuery,
  BookingStatus,
  CreateBookingRequest,
  CreatePosBookingRequest,
  LookupBookingQuery,
  PosBookingResult,
} from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/bookings`;

  create(payload: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.baseUrl, payload);
  }

  createPos(payload: CreatePosBookingRequest): Observable<PosBookingResult> {
    return this.http.post<PosBookingResult>(`${this.baseUrl}/pos`, payload);
  }

  lookup(query: LookupBookingQuery): Observable<Booking> {
    let params = new HttpParams().set('reference', query.reference);

    if (query.phone) {
      params = params.set('phone', query.phone);
    }

    if (query.email) {
      params = params.set('email', query.email);
    }

    return this.http.get<Booking>(`${this.baseUrl}/lookup`, { params });
  }

  list(query: BookingListQuery = {}): Observable<Booking[]> {
    let params = new HttpParams();

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.trip) {
      params = params.set('trip', query.trip);
    }

    return this.http.get<Booking[]>(this.baseUrl, { params });
  }

  listMine(): Observable<Booking[]> {
    return this.list();
  }

  getById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/${id}`);
  }

  updateStatus(id: string, status: BookingStatus): Observable<Booking> {
    return this.http.patch<Booking>(`${this.baseUrl}/${id}/status`, { status });
  }

  cancel(id: string): Observable<Booking> {
    return this.updateStatus(id, 'cancelled');
  }
}
