import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="admin-shell">
      <aside class="admin-side">
        <a routerLink="/" class="logo">Phone<span>Shop</span></a>
        <p class="side-label">Quản trị</p>
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
        <a routerLink="/admin/products" routerLinkActive="active">Sản phẩm</a>
        <a routerLink="/admin/orders" routerLinkActive="active">Đơn hàng</a>
        <a routerLink="/admin/ai" routerLinkActive="active">AI</a>
        <button class="btn-ghost" (click)="logout()">Đăng xuất</button>
      </aside>
      <section class="admin-content">
        <router-outlet></router-outlet>
      </section>
    </div>
  `
})
export class AdminLayoutComponent {
  constructor(private auth: AuthService, private router: Router) {}
  logout() { this.auth.logout(); this.router.navigate(['/']); }
}
