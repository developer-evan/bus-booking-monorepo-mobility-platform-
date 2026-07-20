import { Component } from '@angular/core';
import { Divider } from 'primeng/divider';

@Component({
  selector: 'app-landing-footer',
  imports: [Divider],
  template: `
    <footer
      class="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="mx-auto max-w-6xl px-6 pb-8 pt-12">
        <div class="grid gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div class="max-w-72">
            <div
              class="inline-flex items-center gap-2 text-[1.0625rem] font-semibold text-neutral-900 dark:text-neutral-50"
            >
              <i class="pi pi-directions text-teal-600 dark:text-teal-400" aria-hidden="true"></i>
              <span>BusBook</span>
            </div>
            <p class="mt-3 text-[0.9375rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
              Simple, reliable bus travel across Kenya. Book seats in minutes.
            </p>
          </div>

          @for (column of columns; track column.title) {
            <div>
              <h3
                class="mb-3.5 text-[0.8125rem] font-semibold uppercase tracking-wide text-neutral-900 dark:text-neutral-50"
              >
                {{ column.title }}
              </h3>
              <ul class="grid list-none gap-2 p-0">
                @for (link of column.links; track link) {
                  <li>
                    <a
                      href="#"
                      class="text-[0.9375rem] text-neutral-500 no-underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                    >
                      {{ link }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <p-divider class="my-8" />

        <div
          class="flex flex-col gap-3 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between dark:text-neutral-400"
        >
          <span>&copy; {{ year }} BusBook. All rights reserved.</span>
          <div class="flex gap-5">
            <a href="#" class="text-neutral-500 no-underline hover:text-neutral-900 dark:hover:text-neutral-50"
              >Privacy</a
            >
            <a href="#" class="text-neutral-500 no-underline hover:text-neutral-900 dark:hover:text-neutral-50"
              >Terms</a
            >
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class LandingFooterComponent {
  protected readonly year = new Date().getFullYear();

  protected readonly columns = [
    {
      title: 'Product',
      links: ['Search routes', 'My bookings', 'Mobile tickets'],
    },
    {
      title: 'Company',
      links: ['About', 'Careers', 'Contact'],
    },
    {
      title: 'Operators',
      links: ['Partner with us', 'Operator portal', 'Support'],
    },
  ];
}
