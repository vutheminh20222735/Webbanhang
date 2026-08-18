import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  template: `
    <section class="hero">
      <div>
        <p class="eyebrow">Cửa hàng điện thoại</p>
        <h1>Điện thoại chính hãng, giá tốt mỗi ngày</h1>
        <p>iPhone, Samsung, Xiaomi, OPPO — bảo hành 12 tháng, giao hàng toàn quốc.</p>
      </div>
    </section>
    <h2 class="section-title">Điện thoại nổi bật</h2>
    <div class="product-grid" *ngIf="products.length; else empty">
      <a class="product-card" *ngFor="let p of products" [routerLink]="['/product', p._id]">
        <div class="thumb">
          <img [src]="p.images?.[0] || placeholder" [alt]="p.name" />
        </div>
        <div class="info">
          <span class="brand">{{p.brand}}</span>
          <h3>{{p.name}}</h3>
          <p class="spec">{{p.ram}} · {{p.storage}} · {{p.color}}</p>
          <div class="price-row">
            <strong>{{p.salePrice || p.price | number}}₫</strong>
            <s *ngIf="p.salePrice">{{p.price | number}}₫</s>
          </div>
        </div>
      </a>
    </div>
    <ng-template #empty>
      <p class="muted">Chưa có sản phẩm.</p>
    </ng-template>
  `
})
export class ProductsListComponent implements OnInit {
  products: any[] = [];
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';
  constructor(private http: HttpClient) {}
  ngOnInit() {
    this.http.get(`${environment.apiUrl}/products`).subscribe((res: any) => this.products = res.data?.items || []);
  }
}
