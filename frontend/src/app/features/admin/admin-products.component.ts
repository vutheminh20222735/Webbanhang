import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss']
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
