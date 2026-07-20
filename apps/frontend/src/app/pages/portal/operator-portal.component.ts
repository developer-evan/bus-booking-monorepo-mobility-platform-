import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { roleLabel } from '../../core/models/auth.model';
import { PortalShellComponent } from '../../layout/portal-shell/portal-shell.component';

@Component({
  selector: 'app-operator-portal',
  imports: [PortalShellComponent],
  template: `
    <app-portal-shell
      title="Operator portal"
      subtitle="Handle walk-in bookings, trip operations, and passenger check-in"
    >
      <div class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Signed in as <span class="font-medium text-neutral-900 dark:text-neutral-50">{{ user()?.fullName }}</span>
          ({{ roleLabel(user()?.role!) }})
        </p>
        <p class="mt-4 text-neutral-600 dark:text-neutral-300">
          POS booking and trip management screens will be added in the next portal phase.
        </p>
      </div>
    </app-portal-shell>
  `,
})
export class OperatorPortalComponent {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;
  protected readonly roleLabel = roleLabel;
}
