import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { AuthService } from '../../core/services/auth.service';
import { extractApiErrorMessage } from '../../core/utils/auth.util';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-activate-account',
  imports: [ReactiveFormsModule, RouterLink, Button, InputText, Password, ThemeToggleComponent],
  template: `
    <div class="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
      <div class="mx-auto flex max-w-6xl justify-end px-6 py-4">
        <app-theme-toggle />
      </div>

      <div class="mx-auto grid max-w-md px-6 pb-16">
        <a routerLink="/" class="mb-8 inline-flex items-center gap-2 text-neutral-900 no-underline dark:text-neutral-50">
          <span
            class="inline-flex size-8 items-center justify-center rounded-lg border border-teal-600 text-sm text-teal-600 dark:border-teal-400 dark:text-teal-400"
          >
            <i class="pi pi-directions"></i>
          </span>
          <span class="text-lg font-semibold">BusBook</span>
        </a>

        <div class="rounded-xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
          <h1 class="text-2xl font-bold tracking-tight">Activate staff account</h1>
          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Enter the email or phone you were invited with, verify the OTP, then set your password.
          </p>

          @if (step() === 1) {
            <form class="mt-6 grid gap-4" [formGroup]="identifierForm" (ngSubmit)="sendOtp()">
              <div class="grid gap-1.5">
                <label for="identifier" class="text-sm font-semibold text-neutral-600 dark:text-neutral-300"
                  >Email or phone</label
                >
                <input
                  pInputText
                  id="identifier"
                  formControlName="identifier"
                  class="w-full"
                  placeholder="you@company.com or +2547..."
                />
              </div>

              @if (error()) {
                <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {{ error() }}
                </p>
              }

              <p-button
                type="submit"
                label="Send OTP"
                icon="pi pi-envelope"
                styleClass="w-full"
                [loading]="sendingOtp()"
                [disabled]="identifierForm.invalid"
              />
            </form>
          } @else {
            <form class="mt-6 grid gap-4" [formGroup]="activateForm" (ngSubmit)="activate()">
              <div class="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200">
                OTP sent to <span class="font-medium">{{ identifier() }}</span>
                @if (devOtp()) {
                  <p class="mt-2 font-mono text-base tracking-widest">Testing OTP: {{ devOtp() }}</p>
                }
              </div>

              <div class="grid gap-1.5">
                <label for="otp" class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">OTP code</label>
                <input
                  pInputText
                  id="otp"
                  formControlName="otp"
                  class="w-full font-mono tracking-widest"
                  maxlength="6"
                  placeholder="6-digit code"
                />
              </div>

              <div class="grid gap-1.5">
                <label for="fullName" class="text-sm font-semibold text-neutral-600 dark:text-neutral-300"
                  >Full name</label
                >
                <input pInputText id="fullName" formControlName="fullName" class="w-full" />
              </div>

              <div class="grid gap-1.5">
                <label for="password" class="text-sm font-semibold text-neutral-600 dark:text-neutral-300"
                  >Password</label
                >
                <p-password
                  inputId="password"
                  formControlName="password"
                  [feedback]="false"
                  [toggleMask]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                />
              </div>

              @if (error()) {
                <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {{ error() }}
                </p>
              }

              <p-button
                type="submit"
                label="Activate account"
                icon="pi pi-check"
                styleClass="w-full"
                [loading]="activating()"
                [disabled]="activateForm.invalid"
              />

              <p-button
                label="Resend OTP"
                icon="pi pi-refresh"
                [text]="true"
                severity="secondary"
                styleClass="w-full"
                [loading]="sendingOtp()"
                (onClick)="sendOtp()"
              />

              <p-button
                label="Use a different contact"
                [text]="true"
                severity="secondary"
                styleClass="w-full"
                (onClick)="backToIdentifier()"
              />
            </form>
          }

          <p class="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
            Already activated?
            <a routerLink="/auth/login" class="font-medium text-teal-600 no-underline dark:text-teal-400">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ActivateAccountComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly step = signal(1);
  protected readonly sendingOtp = signal(false);
  protected readonly activating = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly identifier = signal('');
  protected readonly devOtp = signal<string | null>(null);

  protected readonly identifierForm = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
  });

  protected readonly activateForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    fullName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected sendOtp(): void {
    if (this.step() === 1 && this.identifierForm.invalid) {
      this.identifierForm.markAllAsTouched();
      return;
    }

    const identifier =
      this.step() === 1
        ? this.identifierForm.getRawValue().identifier.trim()
        : this.identifier();

    if (!identifier) {
      return;
    }

    this.sendingOtp.set(true);
    this.error.set(null);

    this.auth.sendInviteOtp({ identifier }).subscribe({
      next: (response) => {
        this.identifier.set(identifier);
        this.devOtp.set(response.otp);
        this.step.set(2);
        this.sendingOtp.set(false);
      },
      error: (err) => {
        this.error.set(extractApiErrorMessage(err, 'Could not send OTP'));
        this.sendingOtp.set(false);
      },
    });
  }

  protected activate(): void {
    if (this.activateForm.invalid) {
      this.activateForm.markAllAsTouched();
      return;
    }

    const { otp, fullName, password } = this.activateForm.getRawValue();

    this.activating.set(true);
    this.error.set(null);

    this.auth
      .activateInvite({
        identifier: this.identifier(),
        otp,
        fullName,
        password,
      })
      .subscribe({
        next: () => {
          this.activating.set(false);
          this.auth.redirectAfterAuth(null);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Activation failed'));
          this.activating.set(false);
        },
      });
  }

  protected backToIdentifier(): void {
    this.step.set(1);
    this.devOtp.set(null);
    this.error.set(null);
    this.activateForm.reset();
  }
}
