import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { portalRouteForRole } from '../../core/models/auth.model';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

/**
 * Public marketing header only — used on landing, search, and book flows.
 * Authenticated dashboards use PortalShellComponent (sidebar + portal navbar).
 */
@Component({
  selector: 'app-landing-header',
  imports: [RouterLink, Button, ThemeToggleComponent],
  template: `
    <header
      class="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90"
      aria-label="Public site header"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
        <a
          routerLink="/"
          class="inline-flex items-center gap-2.5 text-neutral-900 no-underline dark:text-neutral-50"
          aria-label="BusBook home"
        >
          <span
            class="inline-flex size-8 items-center justify-center rounded-lg border border-teal-600 text-sm text-teal-600 dark:border-teal-400 dark:text-teal-400"
            aria-hidden="true"
          >
            <i class="pi pi-directions"></i>
          </span>
          <span class="text-lg font-semibold tracking-tight">BusBook</span>
        </a>

        <nav class="hidden items-center gap-1 md:flex" aria-label="Marketing navigation">
          @for (link of navLinks; track link.fragment) {
            <a
              class="rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-neutral-500 no-underline transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
              routerLink="/"
              [fragment]="link.fragment"
            >
              {{ link.label }}
            </a>
          }
        </nav>

        <div class="flex items-center gap-1">
          <app-theme-toggle />
          @if (auth.isAuthenticated() && auth.user(); as user) {
            <p-button
              [label]="user.fullName.split(' ')[0]"
              [text]="true"
              severity="secondary"
              [routerLink]="portalLink(user.role)"
            />
            <p-button
              label="Sign out"
              [text]="true"
              severity="secondary"
              icon="pi pi-sign-out"
              (onClick)="auth.logout(false)"
            />
          } @else {
            <p-button
              label="Sign in"
              [text]="true"
              severity="secondary"
              routerLink="/auth/login"
            />
            <p-button
              label="Register"
              [outlined]="true"
              severity="secondary"
              routerLink="/auth/register"
              class="hidden sm:inline-flex"
            />
          }
        </div>
      </div>
    </header>
  `,
})
export class LandingHeaderComponent {
  protected readonly auth = inject(AuthService);

  protected readonly navLinks = [
    { label: 'Routes', fragment: 'routes' },
    { label: 'How it works', fragment: 'how-it-works' },
    { label: 'For operators', fragment: 'operators' },
  ];

  protected portalLink(role: Parameters<typeof portalRouteForRole>[0]): string {
    return portalRouteForRole(role);
  }
}
