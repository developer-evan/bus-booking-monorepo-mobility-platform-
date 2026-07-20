import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Company,
  CreateCompanyRequest,
  CreateInviteRequest,
  InviteResult,
  UpdateCompanyRequest,
} from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompaniesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/companies`;

  list(): Observable<Company[]> {
    return this.http.get<Company[]>(this.baseUrl);
  }

  getById(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateCompanyRequest): Observable<Company> {
    return this.http.patch<Company>(`${this.baseUrl}/${id}`, payload);
  }

  createInvite(companyId: string, payload: CreateInviteRequest): Observable<InviteResult> {
    return this.http.post<InviteResult>(`${this.baseUrl}/${companyId}/invites`, payload);
  }
}
