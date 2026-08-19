import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-customer-layout',
  template: `
    <div class="nav-backdrop" *ngIf="menuOpen" (click)="closeMenu()"></div>
    <header class="shop-header" [class.menu-open]="menuOpen">
      <div class="shop-header-inner">
        <a routerLink="/" class="logo" (click)="closeMenu()">Phone<span>Shop</span></a>
        <nav class="shop-nav" [class.open]="menuOpen" (click)="$event.stopPropagation()">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Điện thoại</a>
          <a routerLink="/wishlist" routerLinkActive="active" (click)="closeMenu()">Yêu thích</a>
          <a routerLink="/cart" routerLinkActive="active" class="nav-cart" (click)="closeMenu()">
            Giỏ hàng
            <span class="cart-badge" *ngIf="(cart.count$ | async) as n">{{ n }}</span>
          </a>
          <a routerLink="/orders" routerLinkActive="active" (click)="closeMenu()">Đơn hàng</a>
          <a *ngIf="loggedIn" routerLink="/account/profile" routerLinkActive="active" [class.active]="isAccount" (click)="closeMenu()">Tài khoản</a>
          <a *ngIf="isStaff" routerLink="/admin" (click)="closeMenu()">Quản trị</a>
          <a *ngIf="!loggedIn" routerLink="/login" routerLinkActive="active" class="nav-auth mobile-only" (click)="closeMenu()">Đăng nhập</a>
          <a *ngIf="!loggedIn" routerLink="/register" routerLinkActive="active" class="nav-auth mobile-only" (click)="closeMenu()">Đăng ký</a>
          <button *ngIf="loggedIn" type="button" class="btn-ghost mobile-only" (click)="logout()">Đăng xuất</button>
        </nav>
        <div class="shop-actions desktop-only">
          <a *ngIf="!loggedIn" routerLink="/login" class="btn-primary header-cta">Đăng nhập</a>
          <a *ngIf="!loggedIn" routerLink="/register" class="btn-primary header-cta">Đăng ký</a>
          <button *ngIf="loggedIn" type="button" class="btn-primary header-cta" (click)="logout()">Đăng xuất</button>
        </div>
        <button class="menu-toggle" type="button" (click)="toggleMenu(); $event.stopPropagation()" [attr.aria-expanded]="menuOpen" [attr.aria-label]="menuOpen ? 'Đóng menu' : 'Mở menu'">☰</button>
      </div>
    </header>
    <div class="shop-header-spacer" aria-hidden="true"></div>
    <main class="shop-main" (click)="closeMenu()">
      <router-outlet></router-outlet>
    </main>
    <footer class="shop-footer">
      <p>PhoneShop — Cửa hàng điện thoại chính hãng</p>
      <p>Hotline: 1900 0000 · Hà Nội</p>
    </footer>
    <app-shop-chat></app-shop-chat>
  `
})
export class CustomerLayoutComponent implements OnInit {
  menuOpen = false;
  constructor(public auth: AuthService, public cart: CartService, private wishlist: WishlistService, private router: Router) {}
  ngOnInit() {
    this.cart.refresh();
    this.wishlist.reload();
  }
  get loggedIn() { return !!this.auth.getToken(); }
  get isStaff() { return this.auth.hasRole('ADMIN', 'MANAGER', 'STAFF'); }
  get isAccount() { return this.router.url.startsWith('/account'); }
  closeMenu() { this.menuOpen = false; }
  toggleMenu() { this.menuOpen = !this.menuOpen; }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.menuOpen) this.closeMenu();
  }
  logout() {
    this.auth.logout();
    this.cart.clearCount();
    this.wishlist.reload();
    this.closeMenu();
    this.router.navigate(['/']);
  }
}
