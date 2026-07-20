import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { AuthService } from '../../core/services/auth.service';
import { extractApiErrorMessage } from '../../core/utils/auth.util';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-accept-invite',
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
          <h1 class="text-2xl font-bold tracking-tight">Accept staff invite</h1>
          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            For company admins and operators invited by their organization.
          </p>

          <form class="mt-6 grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
            <div class="grid gap-1.5">
              <label for="token" class="text-sm font-semibold text-neutral-600 dark:text-neutral-300"
                >Invite token</label
              >
              <input pInputText id="token" formControlName="token" class="w-full" />
            </div>

            <div class="grid gap-1.5">
              <label for="fullName" class="text-sm font-semibold text-neutral-600 dark:text-neutral-300"
                >Full name</label
              >
              <input pInputText id="fullName" formControlName="fullName" class="w-full" />
            </div>

            <div class="grid gap-1.5">
              <label for="email" class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">Email</label>
              <input pInputText id="email" type="email" formControlName="email" class="w-full" />
            </div>

            <div class="grid gap-1.5">
              <label for="phone" class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">Phone</label>
              <input pInputText id="phone" formControlName="phone" class="w-full" />
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
              [loading]="submitting()"
              [disabled]="form.invalid"
            />
          </form>

          <p class="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
            Customer?
            <a routerLink="/auth/register" class="font-medium text-teal-600 no-underline dark:text-teal-400"
              >Register here</a
            >
          </p>
        </div>
      </div>
    </div>
  `,
})
export class AcceptInviteComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    token: ['', Validators.required],
    fullName: ['', Validators.required],
    email: [''],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.form.patchValue({ token });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { token, fullName, email, phone, password } = this.form.getRawValue();

    this.submitting.set(true);
    this.error.set(null);

    this.auth
      .acceptInvite({
        token,
        fullName,
        password,
        email: email || undefined,
        phone: phone || undefined,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.auth.redirectAfterAuth(null);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(extractApiErrorMessage(err, 'Invite acceptance failed'));
        },
      });
  }
}
