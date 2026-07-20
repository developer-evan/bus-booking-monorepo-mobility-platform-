import { Component } from '@angular/core';
import { Divider } from 'primeng/divider';

@Component({
  selector: 'app-landing-footer',
  imports: [Divider],
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.css',
})
export class LandingFooterComponent {
  protected readonly year = new Date().getFullYear();

  protected readonly columns = [
    {
      title: 'Product',
      links: ['Search routes', 'My bookings', 'Mobile tickets'],
    },
    {
      title: 'Company',
      links: ['About', 'Careers', 'Contact'],
    },
    {
      title: 'Operators',
      links: ['Partner with us', 'Operator portal', 'Support'],
    },
  ];
}
