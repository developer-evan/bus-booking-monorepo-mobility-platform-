import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY = 'bus-booking-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.readInitialTheme());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('app-dark', dark);
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update((value) => !value);
  }

  setDark(enabled: boolean): void {
    this.isDark.set(enabled);
  }

  private readInitialTheme(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
