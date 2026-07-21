import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Company } from '../../../core/models/company.model';
import { CompaniesApiService } from '../../../core/services/companies-api.service';
import { extractApiErrorMessage } from '../../../core/utils/auth.util';

@Component({
  selector: 'app-super-admin-dashboard',
  imports: [RouterLink, Button, Tag],
  template: `
    @if (loading()) {
      <div class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
      </div>
    } @else if (error()) {
      <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        {{ error() }}
      </div>
    } @else {
      <section
        class="overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white shadow-lg dark:border-neutral-700 sm:p-8"
      >
        <p class="text-sm font-medium text-neutral-300">Platform overview</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Super admin command center</h2>
        <p class="mt-2 max-w-2xl text-sm text-neutral-300">
          Onboard operators, invite company admins, and monitor platform health across all tenants.
        </p>
      </section>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Total companies</p>
          <p class="mt-2 text-3xl font-bold">{{ companies().length }}</p>
        </article>
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Active</p>
          <p class="mt-2 text-3xl font-bold text-teal-600 dark:text-teal-400">{{ activeCount() }}</p>
        </article>
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Suspended</p>
          <p class="mt-2 text-3xl font-bold">{{ suspendedCount() }}</p>
        </article>
        <article class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">Needs admin invite</p>
          <p class="mt-2 text-3xl font-bold">{{ companies().length }}</p>
        </article>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <p-button label="Manage companies" icon="pi pi-building" routerLink="/portal/super-admin/companies" />
        <p-button
          label="Add company"
          icon="pi pi-plus"
          [outlined]="true"
          routerLink="/portal/super-admin/companies"
        />
      </div>

      <section class="mt-8 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div class="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h3 class="text-lg font-semibold">Recently onboarded</h3>
        </div>
        @if (recentCompanies().length === 0) {
          <p class="p-6 text-sm text-neutral-500 dark:text-neutral-400">No companies onboarded yet.</p>
        } @else {
          <div class="divide-y divide-neutral-200 dark:divide-neutral-800">
            @for (company of recentCompanies(); track company._id) {
              <div class="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p class="font-semibold">{{ company.name }}</p>
                  <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {{ company.email }} · {{ company.slug }}
                  </p>
                </div>
                <p-tag [value]="company.status" [rounded]="true" />
              </div>
            }
          </div>
        }
      </section>
    }
  `,
})
export class SuperAdminDashboardComponent implements OnInit {
  private readonly companiesApi = inject(CompaniesApiService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly companies = signal<Company[]>([]);

  protected readonly activeCount = computed(
    () => this.companies().filter((company) => company.status === 'active').length,
  );
  protected readonly suspendedCount = computed(
    () => this.companies().filter((company) => company.status === 'suspended').length,
  );
  protected readonly recentCompanies = computed(() => this.companies().slice(0, 5));

  ngOnInit(): void {
    this.companiesApi.list().subscribe({
      next: (companies) => {
        this.companies.set(companies.sort((a, b) => a.name.localeCompare(b.name)));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractApiErrorMessage(err, 'Failed to load dashboard'));
        this.loading.set(false);
      },
    });
  }
}
