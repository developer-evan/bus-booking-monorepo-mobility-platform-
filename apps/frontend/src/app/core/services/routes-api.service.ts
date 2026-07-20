import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BusRoute, RouteQuery } from '../models/route.model';

@Injectable({ providedIn: 'root' })
export class RoutesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/routes`;

  list(query: RouteQuery = {}): Observable<BusRoute[]> {
    return this.http.get<BusRoute[]>(this.baseUrl, {
      params: this.toParams(query),
    });
  }

  getById(id: string): Observable<BusRoute> {
    return this.http.get<BusRoute>(`${this.baseUrl}/${id}`);
  }

  private toParams(query: RouteQuery): HttpParams {
    let params = new HttpParams();

    if (query.origin) {
      params = params.set('origin', query.origin);
    }
    if (query.destination) {
      params = params.set('destination', query.destination);
    }
    if (query.isActive !== undefined) {
      params = params.set('isActive', String(query.isActive));
    }
    if (query.company) {
      params = params.set('company', query.company);
    }

    return params;
  }
}
