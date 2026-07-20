import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip, TripSearchQuery } from '../models/trip.model';

@Injectable({ providedIn: 'root' })
export class TripsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/trips`;

  search(query: TripSearchQuery = {}): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.baseUrl, {
      params: this.toParams(query),
    });
  }

  getById(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.baseUrl}/${id}`);
  }

  private toParams(query: TripSearchQuery): HttpParams {
    let params = new HttpParams();

    const entries = Object.entries(query) as [keyof TripSearchQuery, string | undefined][];

    for (const [key, value] of entries) {
      if (value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    }

    return params;
  }
}
