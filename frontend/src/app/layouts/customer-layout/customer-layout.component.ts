import { Component } from '@angular/core';

@Component({
  selector: 'app-customer-layout',
  template: `
    <header>Phone Shop - Customer</header>
    <main>
      <router-outlet></router-outlet>
    </main>
    <footer>© Phone Shop</footer>
  `
})
export class CustomerLayoutComponent {}
