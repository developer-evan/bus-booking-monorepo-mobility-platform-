import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-portal-placeholder',
  imports: [RouterLink, Button],
  template: `
    <div class="placeholder">
      <div class="placeholder__panel">
        <span class="placeholder__badge">Coming soon</span>
        <h1>Operator &amp; admin portal</h1>
        <p>
          The authenticated portal is next on the roadmap. For now, explore the
          public landing experience.
        </p>
        <p-button label="Back to home" icon="pi pi-arrow-left" routerLink="/" />
      </div>
    </div>
  `,
  styles: `
    .placeholder {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background: var(--surface-ground);
      color: var(--text-primary);
    }

    .placeholder__panel {
      max-width: 28rem;
      border: 1px solid var(--surface-border);
      border-radius: 0.875rem;
      background: var(--surface-section);
      padding: 2rem;
      text-align: center;
    }

    .placeholder__badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border: 1px solid var(--surface-border);
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--accent);
    }

    h1 {
      margin: 1rem 0 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    p {
      margin: 0.75rem 0 1.5rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }
  `,
})
export class PortalPlaceholderComponent {}
