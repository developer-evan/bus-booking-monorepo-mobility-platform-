import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [Button],
  template: `
    <p-button
      [icon]="theme.isDark() ? 'pi pi-sun' : 'pi pi-moon'"
      [rounded]="true"
      [text]="true"
      severity="secondary"
      [ariaLabel]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      (onClick)="theme.toggle()"
    />
  `,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
}
