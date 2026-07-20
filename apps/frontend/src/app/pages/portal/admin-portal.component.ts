import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { AuthService } from '../../core/services/auth.service';
import { Company, InviteResult } from '../../core/models/company.model';
import { CompaniesApiService } from '../../core/services/companies-api.service';
import { extractApiErrorMessage } from '../../core/utils/auth.util';
import { buildActivateAccountUrl, copyToClipboard } from '../../core/utils/invite.util';
import { PortalShellComponent } from '../../layout/portal-shell/portal-shell.component';

@Component({
  selector: 'app-admin-portal',
  imports: [ReactiveFormsModule, Button, InputText, Tag, DatePipe, PortalShellComponent],
  template: `
    <app-portal-shell
      title="Company admin portal"
      subtitle="Invite operators and manage your company's operations"
    >
      @if (loading()) {
        <div class="rounded-xl border border-neutral-200 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <i class="pi pi-spin pi-spinner text-2xl text-teal-600 dark:text-teal-400"></i>
        </div>
      } @else if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {{ error() }}
        </div>
      } @else if (company(); as currentCompany) {
        <div class="grid gap-6 lg:grid-cols-2">
          <section class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-xl font-semibold">{{ currentCompany.name }}</h2>
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{{ currentCompany.slug }}</p>
              </div>
              <p-tag [value]="currentCompany.status" [rounded]="true" />
            </div>
            <dl class="mt-6 grid gap-3 text-sm">
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Email</dt>
                <dd class="font-medium">{{ currentCompany.email }}</dd>
              </div>
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Phone</dt>
                <dd class="font-medium">{{ currentCompany.phone }}</dd>
              </div>
            </dl>
            <p class="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
              Routes, buses, trips, and POS booking tools will be added here next.
            </p>
          </section>

          <section class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 class="text-lg font-semibold">Invite operator</h2>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Operators can handle walk-in bookings, trips, and day-to-day terminal work.
            </p>

            <form class="mt-5 grid gap-3" [formGroup]="inviteForm" (ngSubmit)="inviteOperator()">
              <input
                pInputText
                formControlName="email"
                class="w-full"
                placeholder="Operator email (optional if phone provided)"
              />
              <input
                pInputText
                formControlName="phone"
                class="w-full"
                placeholder="Operator phone"
              />
              @if (inviteError()) {
                <p class="text-sm text-red-600 dark:text-red-400">{{ inviteError() }}</p>
              }
              <p-button
                type="submit"
                label="Send operator invite"
                icon="pi pi-send"
                [loading]="inviting()"
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
          </section>
        </div>
      }
    </app-portal-shell>
  `,
})
export class AdminPortalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly companiesApi = inject(CompaniesApiService);

  protected readonly loading = signal(true);
  protected readonly inviting = signal(false);
  protected readonly copied = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly company = signal<Company | null>(null);
  protected readonly lastInvite = signal<InviteResult | null>(null);

  protected readonly inviteForm = this.fb.group({
    email: [''],
    phone: [''],
  });

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

  protected activateUrl(): string {
    return buildActivateAccountUrl();
  }

  protected inviteOperator(): void {
    const company = this.company();
    const { email, phone } = this.inviteForm.getRawValue();

    if (!company) {
      return;
    }

    if (!email && !phone) {
      this.inviteError.set('Provide an email or phone for the operator invite.');
      return;
    }

    this.inviting.set(true);
    this.inviteError.set(null);
    this.copied.set(false);

    this.companiesApi
      .createInvite(company._id, {
        role: 'operator',
        email: email || undefined,
        phone: phone || undefined,
      })
      .subscribe({
        next: (invite) => {
          this.lastInvite.set(invite);
          this.inviting.set(false);
          this.inviteForm.reset();
        },
        error: (err) => {
          this.inviteError.set(extractApiErrorMessage(err, 'Failed to create invite'));
          this.inviting.set(false);
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
