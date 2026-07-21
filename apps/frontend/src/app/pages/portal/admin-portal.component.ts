import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { portalNavItemsForRole } from '../../core/models/portal-nav.model';
import { readPortalPageMeta } from '../../core/utils/portal-page-meta.util';
import { PortalShellComponent } from '../../layout/portal-shell/portal-shell.component';

const DEFAULT_META = {
  title: 'Company admin portal',
  subtitle: '',
};

@Component({
  selector: 'app-admin-portal',
  imports: [PortalShellComponent, RouterOutlet],
  template: `
    <app-portal-shell
      [title]="pageMeta().title"
      [subtitle]="pageMeta().subtitle"
      portalLabel="Company Admin"
      [navItems]="navItems"
    >
      <router-outlet />
    </app-portal-shell>
  `,
})
export class AdminPortalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly navItems = portalNavItemsForRole('admin');

  protected readonly pageMeta = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => readPortalPageMeta(this.route, DEFAULT_META)),
    ),
    { initialValue: DEFAULT_META },
  );
}
