import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { portalRouteForRole, roleLabel } from '../../core/models/auth.model';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-portal-shell',
  imports: [RouterLink, Button, ThemeToggleComponent],
  template: `
    <div class="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <header class="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <a routerLink="/" class="inline-flex items-center gap-2 no-underline text-inherit">
            <span
              class="inline-flex size-8 items-center justify-center rounded-lg border border-teal-600 text-sm text-teal-600 dark:border-teal-400 dark:text-teal-400"
            >
              <i class="pi pi-directions"></i>
            </span>
            <span class="text-lg font-semibold">BusBook</span>
          </a>

          <div class="flex items-center gap-1">
            <app-theme-toggle />
            @if (user(); as currentUser) {
              <span class="hidden px-2 text-sm text-neutral-500 sm:inline dark:text-neutral-400">
                {{ currentUser.fullName }} · {{ roleLabel(currentUser.role) }}
              </span>
              <p-button
                label="Sign out"
                [text]="true"
                severity="secondary"
                icon="pi pi-sign-out"
                (onClick)="logout()"
              />
            }
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-6 py-10">
        <div class="mb-8">
          <h1 class="text-3xl font-bold tracking-tight">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="mt-2 text-neutral-500 dark:text-neutral-400">{{ subtitle() }}</p>
          }
        </div>

        <ng-content />
      </main>
    </div>
  `,
})
export class PortalShellComponent {
  private readonly auth = inject(AuthService);

  readonly title = input.required<string>();
  readonly subtitle = input<string>('');

  protected readonly user = this.auth.user;
  protected readonly roleLabel = roleLabel;

  protected logout(): void {
    this.auth.logout();
  }
}
