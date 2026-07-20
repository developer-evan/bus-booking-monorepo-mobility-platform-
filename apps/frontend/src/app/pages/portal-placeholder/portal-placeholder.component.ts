import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-portal-placeholder',
  imports: [RouterLink, Button],
  template: `
    <div
      class="grid min-h-dvh place-items-center bg-neutral-50 p-6 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50"
    >
      <div
        class="max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900"
      >
        <span
          class="inline-block rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-teal-600 dark:border-neutral-800 dark:text-teal-400"
        >
          Coming soon
        </span>
        <h1 class="mt-4 text-2xl font-bold">Operator &amp; admin portal</h1>
        <p class="mb-6 mt-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
          The authenticated portal is next on the roadmap. For now, explore the
          public landing experience.
        </p>
        <p-button label="Back to home" icon="pi pi-arrow-left" routerLink="/" />
      </div>
    </div>
  `,
})
export class PortalPlaceholderComponent {}
