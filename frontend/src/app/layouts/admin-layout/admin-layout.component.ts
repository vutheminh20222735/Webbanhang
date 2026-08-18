import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="admin-shell">
      <aside class="admin-side">
        <div class="admin-side-head">
          <a routerLink="/" class="logo">Phone<span>Shop</span></a>
          <button class="menu-toggle" type="button" (click)="menuOpen = !menuOpen">☰</button>
        </div>
        <nav class="admin-links" [class.open]="menuOpen">
          <p class="side-label">{{roleLabel}}</p>
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Tổng quan</a>
          <a routerLink="/admin/products" routerLinkActive="active" (click)="closeMenu()">Sản phẩm</a>
          <a routerLink="/admin/orders" routerLinkActive="active" (click)="closeMenu()">Đơn hàng</a>
          <a *ngIf="isAdmin" routerLink="/admin/coupons" routerLinkActive="active" (click)="closeMenu()">
  Mã giảm giá
</a>
          <a *ngIf="isAdmin" routerLink="/admin/users" routerLinkActive="active" (click)="closeMenu()">Nhân viên</a>
          <a *ngIf="canAi" routerLink="/admin/ai" routerLinkActive="active" (click)="closeMenu()">Trợ lý AI</a>
          <a routerLink="/" class="side-store" (click)="closeMenu()">← Về cửa hàng</a>
          <button class="btn-ghost" (click)="logout()">Đăng xuất</button>
        </nav>
      </aside>
      <section class="admin-content">
        <header class="admin-top">
          <h1>{{title}}</h1>
          <span class="badge">{{role}}</span>
        </header>
        <router-outlet></router-outlet>
      </section>
    </div>
  `
})
export class AdminLayoutComponent {
  menuOpen = false;
  constructor(public auth: AuthService, private router: Router) {}
  get role() { return this.auth.getUserFromToken()?.role || ''; }
  get isAdmin() { return this.auth.hasRole('ADMIN'); }
  get canAi() { return this.auth.hasRole('ADMIN', 'MANAGER'); }
  get roleLabel() {
    if (this.role === 'ADMIN') return 'Quản trị viên';
    if (this.role === 'MANAGER') return 'Quản lý';
    return 'Nhân viên';
  }
  get title() { return 'Bảng điều khiển'; }
  closeMenu() { this.menuOpen = false; }
  logout() { this.auth.logout(); this.router.navigate(['/']); }
}
