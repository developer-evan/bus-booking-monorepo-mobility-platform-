import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-landing-header',
  imports: [RouterLink, Button, ThemeToggleComponent],
  templateUrl: './landing-header.component.html',
  styleUrl: './landing-header.component.css',
})
export class LandingHeaderComponent {
  protected readonly navLinks = [
    { label: 'Routes', href: '#routes' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'For operators', href: '#operators' },
  ];
}
