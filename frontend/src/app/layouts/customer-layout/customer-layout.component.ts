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
      <div class="shop-header-top">
        <div class="shop-header-inner">
          <a routerLink="/" class="logo" (click)="closeMenu()">
            <span class="logo-icon" aria-hidden="true">📱</span>
            Phone<span>Shop</span>
          </a>
          <form class="header-search" (submit)="search($event)">
            <input name="q" [(ngModel)]="searchText" placeholder="Bạn tìm gì..." autocomplete="off" />
            <button type="submit" aria-label="Tìm kiếm">⌕</button>
          </form>
          <div class="shop-actions desktop-only">
            <a *ngIf="!loggedIn" routerLink="/login" class="header-link">Đăng nhập</a>
            <a *ngIf="loggedIn" routerLink="/account/profile" class="header-link">Tài khoản</a>
            <a routerLink="/wishlist" class="header-link">Yêu thích</a>
            <a routerLink="/cart" class="header-link nav-cart">
              Giỏ hàng
              <span class="cart-badge" *ngIf="(cart.count$ | async) as n">{{ n }}</span>
            </a>
            <button *ngIf="loggedIn" type="button" class="header-link header-link-btn" (click)="logout()">Đăng xuất</button>
          </div>
          <button class="menu-toggle" type="button" (click)="toggleMenu(); $event.stopPropagation()" [attr.aria-expanded]="menuOpen" [attr.aria-label]="menuOpen ? 'Đóng menu' : 'Mở menu'">☰</button>
        </div>
      </div>
      <div class="shop-header-cats">
        <div class="shop-header-inner">
          <nav class="shop-nav" [class.open]="menuOpen" (click)="$event.stopPropagation()">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Điện thoại</a>
            <a routerLink="/" [queryParams]="{brand: 'Apple'}" (click)="closeMenu()">Apple</a>
            <a routerLink="/" [queryParams]="{brand: 'Samsung'}" (click)="closeMenu()">Samsung</a>
            <a routerLink="/wishlist" routerLinkActive="active" (click)="closeMenu()">Yêu thích</a>
            <a routerLink="/cart" routerLinkActive="active" class="nav-cart mobile-only" (click)="closeMenu()">
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
        </div>
      </div>
    </header>
    <div class="shop-header-spacer" aria-hidden="true"></div>
    <div class="store-wrap">
      <main class="shop-main" (click)="closeMenu()">
        <router-outlet></router-outlet>
      </main>
    </div>
    <section class="shop-usp" aria-label="Cam kết dịch vụ">
      <div class="shop-usp-inner">
        <div class="usp-item">
          <span class="usp-icon" aria-hidden="true">✓</span>
          <div>
            <strong>Hàng chính hãng</strong>
            <span>100% chính hãng, hóa đơn đầy đủ</span>
          </div>
        </div>
        <div class="usp-item">
          <span class="usp-icon" aria-hidden="true">🛡</span>
          <div>
            <strong>Bảo hành uy tín</strong>
            <span>Bảo hành chính hãng 12 tháng</span>
          </div>
        </div>
        <div class="usp-item">
          <span class="usp-icon" aria-hidden="true">🚚</span>
          <div>
            <strong>Giao hàng nhanh</strong>
            <span>Giao toàn quốc, nhanh trong 2H</span>
          </div>
        </div>
        <div class="usp-item">
          <span class="usp-icon" aria-hidden="true">💳</span>
          <div>
            <strong>Thanh toán dễ dàng</strong>
            <span>COD, thẻ, ví điện tử</span>
          </div>
        </div>
      </div>
    </section>
    <footer class="shop-footer">
      <p>PhoneShop — Cửa hàng điện thoại chính hãng</p>
      <p>Hotline: 1900 0000 · Hà Nội</p>
    </footer>
    <app-shop-chat></app-shop-chat>
  `
})
export class CustomerLayoutComponent implements OnInit {
  menuOpen = false;
  searchText = '';
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
  search(e: Event) {
    e.preventDefault();
    const q = (this.searchText || '').trim();
    this.closeMenu();
    this.router.navigate(['/'], { queryParams: q ? { q } : {} });
  }

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
