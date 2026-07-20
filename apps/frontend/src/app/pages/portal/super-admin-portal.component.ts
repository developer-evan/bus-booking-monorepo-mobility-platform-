import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Company, InviteResult } from '../../core/models/company.model';
import { CompaniesApiService } from '../../core/services/companies-api.service';
import { extractApiErrorMessage } from '../../core/utils/auth.util';
import { buildActivateAccountUrl, copyToClipboard } from '../../core/utils/invite.util';
import { PortalShellComponent } from '../../layout/portal-shell/portal-shell.component';

@Component({
  selector: 'app-super-admin-portal',
  imports: [
    ReactiveFormsModule,
    Button,
    InputText,
    Tag,
    DatePipe,
    PortalShellComponent,
  ],
  template: `
    <app-portal-shell
      title="Super admin portal"
      subtitle="Onboard bus companies and invite their admins"
    >
      <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <!-- Companies list -->
        <section class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div>
              <h2 class="text-lg font-semibold">Companies</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ companies().length }} onboarded
              </p>
            </div>
            <p-button
              label="Add company"
              icon="pi pi-plus"
              [outlined]="!showCreateForm()"
              (onClick)="toggleCreateForm()"
            />
          </div>

          @if (showCreateForm()) {
            <form
              class="grid gap-3 border-b border-neutral-200 p-5 dark:border-neutral-800"
              [formGroup]="createCompanyForm"
              (ngSubmit)="createCompany()"
            >
              <h3 class="font-semibold">New company</h3>
              <input pInputText formControlName="name" class="w-full" placeholder="Company name" />
              <input
                pInputText
                type="email"
                formControlName="email"
                class="w-full"
                placeholder="Company email"
              />
              <input pInputText formControlName="phone" class="w-full" placeholder="Company phone" />
              <input
                pInputText
                formControlName="slug"
                class="w-full"
                placeholder="Slug (optional)"
              />
              @if (createError()) {
                <p class="text-sm text-red-600 dark:text-red-400">{{ createError() }}</p>
              }
              <div class="flex gap-2">
                <p-button
                  type="submit"
                  label="Create company"
                  icon="pi pi-check"
                  [loading]="creating()"
                  [disabled]="createCompanyForm.invalid"
                />
                <p-button
                  label="Cancel"
                  [text]="true"
                  severity="secondary"
                  (onClick)="showCreateForm.set(false)"
                />
              </div>
            </form>
          }

          @if (loading()) {
            <div class="p-10 text-center">
              <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
            </div>
          } @else if (listError()) {
            <p class="p-5 text-sm text-red-600 dark:text-red-400">{{ listError() }}</p>
          } @else if (companies().length === 0) {
            <p class="p-5 text-neutral-500 dark:text-neutral-400">No companies yet. Add the first one.</p>
          } @else {
            <div class="divide-y divide-neutral-200 dark:divide-neutral-800">
              @for (company of companies(); track company._id) {
                <button
                  type="button"
                  class="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-950"
                  [class.bg-neutral-50]="selectedCompany()?._id === company._id"
                  [class.dark:bg-neutral-950]="selectedCompany()?._id === company._id"
                  (click)="selectCompany(company)"
                >
                  <div>
                    <p class="font-semibold">{{ company.name }}</p>
                    <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{{ company.slug }}</p>
                    <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {{ company.email }} · {{ company.phone }}
                    </p>
                  </div>
                  <p-tag [value]="company.status" [rounded]="true" />
                </button>
              }
            </div>
          }
        </section>

        <!-- Company detail + invite admin -->
        <section class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
          @if (!selectedCompany()) {
            <div class="py-16 text-center text-neutral-500 dark:text-neutral-400">
              <i class="pi pi-building text-3xl"></i>
              <p class="mt-4">Select a company to invite its admin</p>
            </div>
          } @else {
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-xl font-semibold">{{ selectedCompany()!.name }}</h2>
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Slug: {{ selectedCompany()!.slug }}
                </p>
              </div>
              <p-tag [value]="selectedCompany()!.status" [rounded]="true" />
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              @if (selectedCompany()!.status === 'active') {
                <p-button
                  label="Suspend"
                  icon="pi pi-ban"
                  severity="danger"
                  [outlined]="true"
                  [loading]="updatingStatus()"
                  (onClick)="setCompanyStatus('suspended')"
                />
              } @else {
                <p-button
                  label="Activate"
                  icon="pi pi-check-circle"
                  [outlined]="true"
                  [loading]="updatingStatus()"
                  (onClick)="setCompanyStatus('active')"
                />
              }
            </div>

            <div class="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h3 class="font-semibold">Invite company admin</h3>
              <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                The admin can then invite operators and manage routes, buses, and trips.
              </p>

              <form
                class="mt-4 grid gap-3"
                [formGroup]="inviteAdminForm"
                (ngSubmit)="inviteAdmin()"
              >
                <input
                  pInputText
                  formControlName="email"
                  class="w-full"
                  placeholder="Admin email (optional if phone provided)"
                />
                <input
                  pInputText
                  formControlName="phone"
                  class="w-full"
                  placeholder="Admin phone"
                />
                @if (inviteError()) {
                  <p class="text-sm text-red-600 dark:text-red-400">{{ inviteError() }}</p>
                }
                <p-button
                  type="submit"
                  label="Send admin invite"
                  icon="pi pi-send"
                  [loading]="inviting()"
                  [disabled]="inviteAdminForm.invalid"
                />
              </form>

              @if (lastInvite(); as invite) {
                <div
                  class="mt-6 rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/30"
                >
                  <p class="text-sm font-medium text-teal-800 dark:text-teal-200">Invite created</p>
                  <p class="mt-2 text-sm text-teal-900 dark:text-teal-100">
                    Ask them to activate at
                    <span class="font-mono text-xs">{{ activateUrl() }}</span>
                  </p>
                  <p class="mt-2 text-sm text-teal-900 dark:text-teal-100">
                    Contact: {{ invite.email || invite.phone }}
                  </p>
                  <p class="mt-2 font-mono text-lg tracking-widest text-teal-900 dark:text-teal-100">
                    Testing OTP: {{ invite.otp }}
                  </p>
                  <p class="mt-2 text-xs text-teal-700 dark:text-teal-300">
                    OTP expires {{ invite.otpExpiresAt | date: 'medium' }} · Invite expires
                    {{ invite.expiresAt | date: 'medium' }}
                  </p>
                  <p-button
                    class="mt-3"
                    label="Copy activation URL"
                    icon="pi pi-copy"
                    [text]="true"
                    (onClick)="copyActivateUrl()"
                  />
                  <p-button
                    label="Copy OTP"
                    icon="pi pi-key"
                    [text]="true"
                    class="ml-2"
                    (onClick)="copyOtp(invite)"
                  />
                  @if (copied()) {
                    <span class="ml-2 text-sm text-teal-700 dark:text-teal-300">Copied</span>
                  }
                </div>
              }
            </div>
          }
        </section>
      </div>
    </app-portal-shell>
  `,
})
export class SuperAdminPortalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly companiesApi = inject(CompaniesApiService);

  protected readonly loading = signal(true);
  protected readonly creating = signal(false);
  protected readonly inviting = signal(false);
  protected readonly updatingStatus = signal(false);
  protected readonly copied = signal(false);
  protected readonly showCreateForm = signal(false);
  protected readonly listError = signal<string | null>(null);
  protected readonly createError = signal<string | null>(null);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly companies = signal<Company[]>([]);
  protected readonly selectedCompany = signal<Company | null>(null);
  protected readonly lastInvite = signal<InviteResult | null>(null);

  protected readonly createCompanyForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    slug: [''],
  });

  protected readonly inviteAdminForm = this.fb.group({
    email: [''],
    phone: [''],
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

  protected toggleCreateForm(): void {
    this.showCreateForm.update((value) => !value);
    this.createError.set(null);
  }

  protected selectCompany(company: Company): void {
    this.selectedCompany.set(company);
    this.lastInvite.set(null);
    this.inviteError.set(null);
    this.inviteAdminForm.reset();
  }

  protected activateUrl(): string {
    return buildActivateAccountUrl();
  }

  protected loadCompanies(): void {
    this.loading.set(true);
    this.listError.set(null);

    this.companiesApi.list().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.loading.set(false);
        if (!this.selectedCompany() && companies.length > 0) {
          this.selectCompany(companies[0]);
        }
      },
      error: (err) => {
        this.listError.set(extractApiErrorMessage(err, 'Failed to load companies'));
        this.loading.set(false);
      },
    });
  }

  protected createCompany(): void {
    if (this.createCompanyForm.invalid) {
      this.createCompanyForm.markAllAsTouched();
      return;
    }

    const { name, email, phone, slug } = this.createCompanyForm.getRawValue();
    this.creating.set(true);
    this.createError.set(null);

    this.companiesApi
      .create({
        name,
        email,
        phone,
        slug: slug || undefined,
      })
      .subscribe({
        next: (company) => {
          this.companies.update((items) => [...items, company].sort((a, b) => a.name.localeCompare(b.name)));
          this.selectCompany(company);
          this.createCompanyForm.reset();
          this.showCreateForm.set(false);
          this.creating.set(false);
        },
        error: (err) => {
          this.createError.set(extractApiErrorMessage(err, 'Failed to create company'));
          this.creating.set(false);
        },
      });
  }

  protected inviteAdmin(): void {
    const company = this.selectedCompany();
    const { email, phone } = this.inviteAdminForm.getRawValue();

    if (!company) {
      return;
    }

    if (!email && !phone) {
      this.inviteError.set('Provide an email or phone for the admin invite.');
      return;
    }

    this.inviting.set(true);
    this.inviteError.set(null);
    this.copied.set(false);

    this.companiesApi
      .createInvite(company._id, {
        role: 'admin',
        email: email || undefined,
        phone: phone || undefined,
      })
      .subscribe({
        next: (invite) => {
          this.lastInvite.set(invite);
          this.inviting.set(false);
          this.inviteAdminForm.reset();
        },
        error: (err) => {
          this.inviteError.set(extractApiErrorMessage(err, 'Failed to create invite'));
          this.inviting.set(false);
        },
      });
  }

  protected setCompanyStatus(status: 'active' | 'suspended'): void {
    const company = this.selectedCompany();
    if (!company) {
      return;
    }

    this.updatingStatus.set(true);

    this.companiesApi.update(company._id, { status }).subscribe({
      next: (updated) => {
        this.companies.update((items) =>
          items.map((item) => (item._id === updated._id ? updated : item)),
        );
        this.selectedCompany.set(updated);
        this.updatingStatus.set(false);
      },
      error: (err) => {
        this.inviteError.set(extractApiErrorMessage(err, 'Failed to update company status'));
        this.updatingStatus.set(false);
      },
    });
  }

  protected async copyActivateUrl(): Promise<void> {
    const copied = await copyToClipboard(this.activateUrl());
    this.copied.set(copied);
  }

  protected async copyOtp(invite: InviteResult): Promise<void> {
    const copied = await copyToClipboard(invite.otp);
    this.copied.set(copied);
  }
}
