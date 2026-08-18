import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  template: `
    <a routerLink="/" class="back-link">← Tất cả điện thoại</a>
    <p class="muted" *ngIf="loading">Đang tải thông tin máy...</p>
    <p class="error" *ngIf="error">{{error}}</p>
    <div class="detail" *ngIf="product">
      <div class="detail-media">
        <img [src]="product.images?.[0] || placeholder" [alt]="product.name" />
      </div>
      <div class="detail-info">
        <span class="brand">{{product.brand}}</span>
        <h1>{{product.name}}</h1>
        <p class="muted">{{product.description}}</p>
        <ul class="specs">
          <li>RAM: {{product.ram}}</li>
          <li>Bộ nhớ: {{product.storage}}</li>
          <li>Màu: {{product.color}}</li>
          <li>Màn hình: {{product.screen}}</li>
          <li>Chip: {{product.cpu}}</li>
          <li>Camera: {{product.camera}}</li>
          <li>Pin: {{product.battery}}</li>
          <li>Hệ điều hành: {{product.operatingSystem}}</li>
        </ul>
        <div class="price-row">
          <strong>{{product.salePrice || product.price | number}}₫</strong>
          <s *ngIf="product.salePrice">{{product.price | number}}₫</s>
        </div>
        <p class="stock">Còn {{product.stock}} máy</p>
        <label class="qty-label">Số lượng
          <input type="number" [(ngModel)]="qty" min="1" [max]="product.stock" />
        </label>
        <div class="buy-row sticky-buy">
          <button class="btn-outline" (click)="addToCart()">Thêm vào giỏ</button>
          <button class="btn-primary" (click)="buyNow()">Mua ngay</button>
        </div>
        <p class="login-hint" *ngIf="!loggedIn">Cần <a [routerLink]="['/login']" [queryParams]="{returnUrl: currentUrl}">đăng nhập</a> hoặc <a routerLink="/register">đăng ký</a> để mua hàng.</p>
      </div>
    </div>
  `
})
export class ProductDetailComponent implements OnInit, AfterViewInit {
  product: any;
  id: string;
  qty = 1;
  loading = true;
  error = '';
  canReview = false;
  rating = 5;
  title = '';
  body = '';
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
  constructor(private route: ActivatedRoute, private router: Router, private ps: ProductService, private cart: CartService, private http: HttpClient, public auth: AuthService) {}
  get loggedIn() { return !!this.auth.getToken(); }
  get currentUrl() { return this.router.url; }
  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.ps.get(this.id).subscribe((res: any) => {
      this.loading = false;
      this.product = res.data;
    }, err => {
      this.loading = false;
      this.error = err.error?.message || 'Không tải được thông tin điện thoại.';
    });
  }
  requireLogin(): boolean {
    if (this.auth.getToken()) return true;
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return false;
  }
  addToCart() {
    if (!this.requireLogin()) return;
    this.cart.add(this.id, this.qty).subscribe(() => this.router.navigate(['/cart']), () => alert('Không thêm được vào giỏ'));
  }
  buyNow() {
    if (!this.requireLogin()) return;
    this.cart.add(this.id, this.qty).subscribe(() => this.router.navigate(['/checkout']), () => alert('Không mua được, thử lại'));
  }
  ngAfterViewInit() { if (this.auth.getToken()) this.http.get(`${environment.apiUrl}/reviews/can-review/${this.id}`).subscribe((res: any) => this.canReview = !!res.data); }
}
