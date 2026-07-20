import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-landing-header',
  imports: [RouterLink, Button, ThemeToggleComponent],
  template: `
    <header
      class="sticky top-0 z-50 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5"
      >
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

        <nav class="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          @for (link of navLinks; track link.href) {
            <a
              class="text-[0.9375rem] font-medium text-neutral-500 no-underline transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
              [href]="link.href"
            >
              {{ link.label }}
            </a>
          }
        </nav>

        <div class="flex items-center gap-1">
          <app-theme-toggle />
          <p-button
            label="Sign in"
            [text]="true"
            severity="secondary"
            routerLink="/portal"
          />
          <p-button label="Book a trip" routerLink="/portal" class="hidden sm:inline-flex" />
        </div>
      </div>
    </header>
  `,
})
export class LandingHeaderComponent {
  protected readonly navLinks = [
    { label: 'Routes', href: '#routes' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'For operators', href: '#operators' },
  ];
}
