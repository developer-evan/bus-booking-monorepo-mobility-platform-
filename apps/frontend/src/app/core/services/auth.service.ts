import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActivateInviteRequest,
  AuthResponse,
  AuthUser,
  LoginRequest,
  portalRouteForRole,
  RegisterRequest,
  SendInviteOtpRequest,
  SendInviteOtpResponse,
  UserRole,
} from '../models/auth.model';

const TOKEN_KEY = 'bus-booking-token';
const USER_KEY = 'bus-booking-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly tokenState = signal<string | null>(this.readToken());
  private readonly userState = signal<AuthUser | null>(this.readUser());

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  sendInviteOtp(payload: SendInviteOtpRequest): Observable<SendInviteOtpResponse> {
    return this.http.post<SendInviteOtpResponse>(
      `${this.baseUrl}/invite/send-otp`,
      payload,
    );
  }

  activateInvite(payload: ActivateInviteRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/invite/activate`, payload)
      .pipe(tap((response) => this.setSession(response)));
  }

  refreshProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/me`).pipe(
      tap((user) => {
        this.userState.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenState.set(null);
    this.userState.set(null);

    if (redirect) {
      void this.router.navigate(['/auth/login']);
    }
  }

  isAuthenticated(): boolean {
    return !!this.tokenState();
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.userState();
    return !!user && roles.includes(user.role);
  }

  redirectAfterAuth(returnUrl?: string | null): void {
    const user = this.userState();
    if (!user) {
      void this.router.navigate(['/']);
      return;
    }

    const destination =
      returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/auth')
        ? returnUrl
        : portalRouteForRole(user.role);

    void this.router.navigateByUrl(destination);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.tokenState.set(response.accessToken);
    this.userState.set(response.user);
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
