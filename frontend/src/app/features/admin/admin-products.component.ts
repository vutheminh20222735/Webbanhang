import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  template: `
    <div class="admin-card" *ngIf="canCreate">
      <h3>Thêm điện thoại</h3>
      <p class="muted">Chỉ Admin và Manager được thêm sản phẩm.</p>
      <form class="product-form" (submit)="create($event)">
        <div class="form-grid">
          <input name="name" placeholder="Tên máy (vd: iPhone 16 128GB)" required />
          <input name="brand" placeholder="Hãng (Apple, Samsung...)" required />
          <input name="price" type="number" placeholder="Giá (VNĐ)" required />
          <input name="salePrice" type="number" placeholder="Giá khuyến mãi (tuỳ chọn)" />
          <input name="stock" type="number" placeholder="Tồn kho" value="10" />
          <select name="category">
            <option value="">-- Loại --</option>
            <option *ngFor="let c of categories" [value]="c._id">{{c.name}}</option>
          </select>
          <input name="ram" placeholder="RAM (8GB)" />
          <input name="storage" placeholder="Bộ nhớ (256GB)" />
          <input name="color" placeholder="Màu" />
          <input name="screen" placeholder="Màn hình" />
          <input name="cpu" placeholder="Chip" />
          <input name="camera" placeholder="Camera" />
          <input name="battery" placeholder="Pin" />
          <input name="operatingSystem" placeholder="Hệ điều hành" />
        </div>
        <input name="imageUrl" placeholder="Link ảnh (https://...)" />
        <textarea name="description" placeholder="Mô tả sản phẩm" rows="3"></textarea>
        <p class="error" *ngIf="error">{{error}}</p>
        <p class="ok" *ngIf="ok">{{ok}}</p>
        <button class="btn-primary" type="submit">Thêm điện thoại</button>
      </form>
    </div>
    <div class="admin-card">
      <h3>Sản phẩm</h3>
      <table class="admin-table">
        <tr><th>Tên</th><th>Hãng</th><th>Giá</th><th>Tồn</th><th></th></tr>
        <tr *ngFor="let p of products">
          <td>{{p.name}}</td>
          <td>{{p.brand}}</td>
          <td><input class="mini" [(ngModel)]="p.price" /></td>
          <td><input class="mini" [(ngModel)]="p.stock" /></td>
          <td>
            <button class="btn-ghost-dark" (click)="save(p)" *ngIf="canCreate">Lưu</button>
            <button class="btn-ghost-dark" (click)="del(p)" *ngIf="auth.hasRole('ADMIN')">Xóa</button>
          </td>
        </tr>
      </table>
    </div>
  `
})
export class AdminProductsComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  error = '';
  ok = '';
  constructor(private http: HttpClient, public auth: AuthService) {}
  get canCreate() { return this.auth.hasRole('ADMIN', 'MANAGER'); }
  ngOnInit() {
    this.load();
    this.http.get(`${environment.apiUrl}/products/categories`).subscribe((res: any) => this.categories = res.data || []);
  }
  load() {
    this.http.get(`${environment.apiUrl}/products`, { params: { limit: 100 } }).subscribe((res: any) => this.products = res.data?.items || []);
  }
  create(e: Event) {
    e.preventDefault();
    if (!this.canCreate) return;
    this.error = ''; this.ok = '';
    const fd = new FormData(e.target as HTMLFormElement);
    const body: any = {};
    fd.forEach((v, k) => { if (v !== '') body[k] = v; });
    const name = String(body.name || '');
    body.slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now();
    body.price = Number(body.price);
    if (body.salePrice) body.salePrice = Number(body.salePrice);
    body.stock = Number(body.stock || 0);
    if (body.imageUrl) body.images = [body.imageUrl];
    this.http.post(`${environment.apiUrl}/products`, body).subscribe(() => {
      this.ok = 'Đã thêm điện thoại';
      (e.target as HTMLFormElement).reset();
      this.load();
    }, err => this.error = err.error?.message || 'Không thêm được (cần quyền Admin/Manager)');
  }
  save(p: any) { this.http.put(`${environment.apiUrl}/products/${p._id}`, { price: p.price, stock: p.stock }).subscribe(() => this.load(), () => alert('Không lưu được')); }
  del(p: any) { if (!confirm('Xóa sản phẩm?')) return; this.http.delete(`${environment.apiUrl}/products/${p._id}`).subscribe(() => this.load()); }
}
