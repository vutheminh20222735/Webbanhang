import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  template: `
    <nav>Admin Sidebar</nav>
    <section>
      <router-outlet></router-outlet>
    </section>
  `
})
export class AdminLayoutComponent {}
