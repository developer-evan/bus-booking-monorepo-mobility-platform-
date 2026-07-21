import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Company } from '../../../core/models/company.model';
import { AuthService } from '../../../core/services/auth.service';
import { CompaniesApiService } from '../../../core/services/companies-api.service';
import { extractApiErrorMessage } from '../../../core/utils/auth.util';

@Component({
  selector: 'app-admin-company',
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
    } @else if (company(); as currentCompany) {
      <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold tracking-tight">{{ currentCompany.name }}</h2>
              <p class="mt-1 text-neutral-500 dark:text-neutral-400">{{ currentCompany.slug }}</p>
            </div>
            <p-tag [value]="currentCompany.status" [rounded]="true" />
          </div>

          <dl class="mt-8 grid gap-5 sm:grid-cols-2">
            <div class="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-950/50">
              <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Email</dt>
              <dd class="mt-1 font-medium">{{ currentCompany.email }}</dd>
            </div>
            <div class="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-950/50">
              <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Phone</dt>
              <dd class="mt-1 font-medium">{{ currentCompany.phone }}</dd>
            </div>
          </dl>
        </section>

        <section class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 class="font-semibold">Operations checklist</h3>
          <ul class="mt-4 grid gap-3 text-sm">
            <li class="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <i class="pi pi-check-circle mt-0.5 text-teal-600 dark:text-teal-400"></i>
              <span>Company profile is active and visible to staff accounts.</span>
            </li>
            <li class="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <i class="pi pi-users mt-0.5 text-teal-600 dark:text-teal-400"></i>
              <span>Invite operators so they can run POS and check-in workflows.</span>
            </li>
            <li class="flex items-start gap-3 rounded-lg border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
              <i class="pi pi-clock mt-0.5 text-neutral-400"></i>
              <span class="text-neutral-500 dark:text-neutral-400">Routes, buses, and trip scheduling arrive next.</span>
            </li>
          </ul>
          <p-button class="mt-5 block" label="Manage team invites" icon="pi pi-users" routerLink="/portal/admin/team" />
        </section>
      </div>
    }
  `,
})
export class AdminCompanyComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly companiesApi = inject(CompaniesApiService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly company = signal<Company | null>(null);

  ngOnInit(): void {
    const companyId = this.auth.user()?.company;
    if (!companyId) {
      this.error.set('Your account is not linked to a company.');
      this.loading.set(false);
      return;
    }

    this.companiesApi.getById(companyId).subscribe({
      next: (company) => {
        this.company.set(company);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractApiErrorMessage(err, 'Failed to load company'));
        this.loading.set(false);
      },
    });
  }
}
