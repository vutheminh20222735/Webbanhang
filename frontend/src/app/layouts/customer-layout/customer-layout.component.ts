import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-layout',
  template: `
    <header class="shop-header">
      <div class="shop-header-inner">
        <a routerLink="/" class="logo">Phone<span>Shop</span></a>
        <button class="menu-toggle" type="button" (click)="menuOpen = !menuOpen" [attr.aria-expanded]="menuOpen">☰</button>
        <nav class="shop-nav" [class.open]="menuOpen">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Điện thoại</a>
          <a routerLink="/cart" (click)="closeMenu()">Giỏ hàng</a>
          <a routerLink="/orders" (click)="closeMenu()">Đơn hàng</a>
          <a *ngIf="isStaff" routerLink="/admin" (click)="closeMenu()">Quản trị</a>
          <a *ngIf="!loggedIn" routerLink="/login" class="nav-auth mobile-only" (click)="closeMenu()">Đăng nhập</a>
          <a *ngIf="!loggedIn" routerLink="/register" class="nav-auth mobile-only" (click)="closeMenu()">Đăng ký</a>
          <button *ngIf="loggedIn" class="btn-ghost mobile-only" (click)="logout()">Đăng xuất</button>
        </nav>
        <div class="shop-actions desktop-only">
          <a *ngIf="!loggedIn" routerLink="/login" class="btn-ghost">Đăng nhập</a>
          <a *ngIf="!loggedIn" routerLink="/register" class="btn-primary header-cta">Đăng ký</a>
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
  menuOpen = false;
  constructor(public auth: AuthService, private router: Router) {}
  get loggedIn() { return !!this.auth.getToken(); }
  get isStaff() { return this.auth.hasRole('ADMIN', 'MANAGER', 'STAFF'); }
  closeMenu() { this.menuOpen = false; }
  logout() { this.auth.logout(); this.closeMenu(); this.router.navigate(['/']); }
}
