import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { PortalNavItem } from '../../core/models/portal-nav.model';
import { roleLabel } from '../../core/models/auth.model';

@Component({
  selector: 'app-portal-sidebar',
  imports: [RouterLink, Button],
  styles: `
    .nav-item-active {
      background: color-mix(in srgb, var(--p-teal-500, #14b8a6) 12%, transparent);
      color: var(--p-teal-700, #0f766e);
      box-shadow: inset 3px 0 0 var(--p-teal-600, #0d9488);
    }

    :host-context(.dark) .nav-item-active {
      background: color-mix(in srgb, var(--p-teal-400, #2dd4bf) 14%, transparent);
      color: var(--p-teal-200, #99f6e4);
      box-shadow: inset 3px 0 0 var(--p-teal-400, #2dd4bf);
    }

    .nav-item-active .nav-icon {
      background: var(--p-teal-600, #0d9488);
      color: white;
    }

    :host-context(.dark) .nav-item-active .nav-icon {
      background: var(--p-teal-500, #14b8a6);
      color: white;
    }
  `,
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-neutral-200 bg-white transition-transform duration-300 ease-out dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-0 lg:z-20 lg:h-dvh lg:translate-x-0"
      [class.-translate-x-full]="!open()"
      [class.translate-x-0]="open()"
      aria-label="Portal sidebar"
    >
      <div class="flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 px-5 dark:border-neutral-800">
        <a
          [routerLink]="homeRoute()"
          class="inline-flex items-center gap-3 no-underline text-inherit"
          (click)="navigate.emit()"
        >
          <span
            class="inline-flex size-9 items-center justify-center rounded-xl bg-teal-600 text-sm text-white shadow-sm shadow-teal-600/25"
          >
            <i class="pi pi-directions"></i>
          </span>
          <div class="leading-tight">
            <span class="block text-base font-bold tracking-tight">BusBook</span>
            @if (portalLabel()) {
              <span class="block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {{ portalLabel() }}
              </span>
            }
          </div>
        </a>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Portal navigation">
        <p class="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500">
          Dashboard
        </p>
        <div class="grid gap-1">
          @for (item of navItems(); track item.id) {
            @if (item.disabled) {
              <span class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-400 dark:text-neutral-500">
                <span
                  class="nav-icon inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                >
                  <i [class]="item.icon"></i>
                </span>
                <span class="flex-1 font-medium">{{ item.label }}</span>
                @if (item.badge) {
                  <span
                    class="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    {{ item.badge }}
                  </span>
                }
              </span>
            } @else if (item.route) {
              <a
                class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/80"
                [routerLink]="item.route"
                [class.nav-item-active]="isNavItemActive(item)"
                (click)="navigate.emit()"
              >
                <span
                  class="nav-icon inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors dark:bg-neutral-800 dark:text-neutral-400"
                >
                  <i [class]="item.icon"></i>
                </span>
                <span>{{ item.label }}</span>
              </a>
            }
          }
        </div>
      </nav>

      @if (user(); as currentUser) {
        <div class="shrink-0 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <div class="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950/60">
            <p class="truncate text-sm font-semibold">{{ currentUser.fullName }}</p>
            <p class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {{ roleLabel(currentUser.role) }}
            </p>
            <p-button
              class="mt-3 block w-full"
              label="Sign out"
              icon="pi pi-sign-out"
              severity="secondary"
              [outlined]="true"
              styleClass="w-full"
              (onClick)="logout()"
            />
          </div>
        </div>
      }
    </aside>
  `,
})
export class PortalSidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly open = input(false);
  readonly navItems = input<PortalNavItem[]>([]);
  readonly portalLabel = input('');
  readonly homeRoute = input('/portal');

  readonly navigate = output<void>();

  protected readonly user = this.auth.user;
  protected readonly roleLabel = roleLabel;

  protected isNavItemActive(item: PortalNavItem): boolean {
    if (!item.route || item.disabled) {
      return false;
    }

    return this.router.url.split(/[#?]/)[0] === item.route;
  }

  protected logout(): void {
    this.auth.logout();
  }
}
