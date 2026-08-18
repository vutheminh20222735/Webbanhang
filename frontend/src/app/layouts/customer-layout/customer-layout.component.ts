import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-layout',
  template: `
    <header class="shop-header">
      <div class="shop-header-inner">
        <a routerLink="/" class="logo">Phone<span>Shop</span></a>
        <nav class="shop-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Điện thoại</a>
          <a routerLink="/cart">Giỏ hàng</a>
          <a routerLink="/orders">Đơn hàng</a>
          <a *ngIf="isStaff" routerLink="/admin">Quản trị</a>
        </nav>
        <div class="shop-actions">
          <a *ngIf="!loggedIn" routerLink="/login" class="btn-ghost">Đăng nhập</a>
          <button *ngIf="loggedIn" class="btn-ghost" (click)="logout()">Đăng xuất</button>
        </div>
      </div>
    </header>
    <main class="shop-main">
      <router-outlet></router-outlet>
    </main>
    <footer class="shop-footer">
      <p>PhoneShop — Cửa hàng điện thoại chính hãng</p>
      <p>Hotline: 1900 0000 · Hà Nội</p>
    </footer>
    <app-chatbot></app-chatbot>
  `
})
export class CustomerLayoutComponent {
  constructor(public auth: AuthService, private router: Router) {}
  get loggedIn() { return !!this.auth.getToken(); }
  get isStaff() { return this.auth.hasRole('ADMIN', 'MANAGER', 'STAFF'); }
  logout() { this.auth.logout(); this.router.navigate(['/']); }
}
