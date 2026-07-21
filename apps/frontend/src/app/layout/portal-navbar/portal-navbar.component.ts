import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-portal-navbar',
  imports: [RouterLink, Button, ThemeToggleComponent],
  template: `
    <header
      class="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95 sm:px-6"
      aria-label="Portal toolbar"
    >
      <div class="flex min-w-0 items-center gap-3">
        @if (showMenuButton()) {
          <p-button
            class="lg:hidden"
            [text]="true"
            severity="secondary"
            icon="pi pi-bars"
            ariaLabel="Open portal navigation"
            (onClick)="menuToggle.emit()"
          />
        }

        <div class="min-w-0">
          <h1 class="truncate text-lg font-bold tracking-tight sm:text-xl">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="truncate text-sm text-neutral-500 dark:text-neutral-400">{{ subtitle() }}</p>
          }
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <a
          routerLink="/"
          class="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 no-underline transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 md:inline-flex"
        >
          <i class="pi pi-external-link text-xs"></i>
          Public site
        </a>
        <app-theme-toggle />
      </div>
    </header>
  `,
})
export class PortalNavbarComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly showMenuButton = input(false);

  readonly menuToggle = output<void>();
}
