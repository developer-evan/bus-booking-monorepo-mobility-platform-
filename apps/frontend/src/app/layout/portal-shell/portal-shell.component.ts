import { Component, inject, input, signal } from '@angular/core';
import { portalRouteForRole } from '../../core/models/auth.model';
import { PortalNavItem } from '../../core/models/portal-nav.model';
import { AuthService } from '../../core/services/auth.service';
import { PortalNavbarComponent } from '../portal-navbar/portal-navbar.component';
import { PortalSidebarComponent } from '../portal-sidebar/portal-sidebar.component';

/**
 * Authenticated portal layout only — do not use on public/marketing pages.
 * Public pages use LandingHeaderComponent instead.
 */
@Component({
  selector: 'app-portal-shell',
  imports: [PortalSidebarComponent, PortalNavbarComponent],
  template: `
    <div class="flex min-h-dvh bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      @if (sidebarOpen() && navItems().length > 0) {
        <button
          type="button"
          class="fixed inset-0 z-40 bg-neutral-950/50 backdrop-blur-[1px] lg:hidden"
          aria-label="Close portal navigation"
          (click)="closeSidebar()"
        ></button>
      }

      @if (navItems().length > 0) {
        <app-portal-sidebar
          [open]="sidebarOpen()"
          [navItems]="navItems()"
          [portalLabel]="portalLabel()"
          [homeRoute]="portalHomeRoute()"
          (navigate)="closeSidebar()"
        />
      }

      <div class="flex min-h-dvh min-w-0 flex-1 flex-col">
        <app-portal-navbar
          [title]="title()"
          [subtitle]="subtitle()"
          [showMenuButton]="navItems().length > 0"
          (menuToggle)="toggleSidebar()"
        />

        <main class="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div class="mx-auto max-w-6xl">
            <ng-content />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class PortalShellComponent {
  private readonly auth = inject(AuthService);

  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly navItems = input<PortalNavItem[]>([]);
  readonly portalLabel = input<string>('');

  protected readonly sidebarOpen = signal(false);

  protected portalHomeRoute(): string {
    const role = this.auth.user()?.role;
    return role ? portalRouteForRole(role) : '/portal';
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
