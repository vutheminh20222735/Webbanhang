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
          <li>Pin: {{product.battery}}</li>
        </ul>
        <div class="price-row">
          <strong>{{product.salePrice || product.price | number}}₫</strong>
          <s *ngIf="product.salePrice">{{product.price | number}}₫</s>
        </div>
        <p class="stock">Còn {{product.stock}} máy</p>
        <button class="btn-primary" (click)="addToCart()">Thêm vào giỏ</button>
      </div>
    </div>
  `
})
export class ProductDetailComponent implements OnInit, AfterViewInit {
  product: any;
  id: string;
  canReview = false;
  rating = 5;
  title = '';
  body = '';
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
  constructor(private route: ActivatedRoute, private router: Router, private ps: ProductService, private cart: CartService, private http: HttpClient, public auth: AuthService) {}
  ngOnInit() { this.id = this.route.snapshot.params['id']; this.ps.get(this.id).subscribe((res: any) => this.product = res.data); }
  addToCart() {
    if (!this.auth.getToken()) { this.router.navigate(['/login']); return; }
    this.cart.add(this.id, 1).subscribe(() => this.router.navigate(['/cart']), () => alert('Không thêm được vào giỏ'));
  }
  ngAfterViewInit() { if (this.auth.getToken()) this.http.get(`${environment.apiUrl}/reviews/can-review/${this.id}`).subscribe((res: any) => this.canReview = !!res.data); }
  submitReview() {
    if (!this.auth.getToken()) return alert('Cần đăng nhập');
    this.http.post(`${environment.apiUrl}/reviews`, { product: this.id, rating: this.rating, title: this.title, body: this.body }).subscribe(() => { alert('Đã gửi đánh giá'); this.canReview = false; }, () => alert('Gửi đánh giá thất bại'));
  }
}
