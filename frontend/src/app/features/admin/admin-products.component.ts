import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  template: `
    <div class="admin-card">
      <h3>Sản phẩm</h3>
      <table class="admin-table">
        <tr><th>Tên</th><th>Giá</th><th>Tồn</th><th></th></tr>
        <tr *ngFor="let p of products">
          <td>{{p.name}}</td>
          <td><input class="mini" [(ngModel)]="p.price" /></td>
          <td><input class="mini" [(ngModel)]="p.stock" /></td>
          <td>
            <button class="btn-ghost-dark" (click)="save(p)" *ngIf="auth.hasRole('ADMIN','MANAGER')">Lưu</button>
            <button class="btn-ghost-dark" (click)="del(p)" *ngIf="auth.hasRole('ADMIN')">Xóa</button>
          </td>
        </tr>
      </table>
    </div>
  `
})
export class AdminProductsComponent implements OnInit {
  products: any[] = [];
  constructor(private http: HttpClient, public auth: AuthService) {}
  ngOnInit() { this.load(); }
  load() { this.http.get(`${environment.apiUrl}/products`).subscribe((res: any) => this.products = res.data?.items || []); }
  save(p: any) { this.http.put(`${environment.apiUrl}/products/${p._id}`, { price: p.price, stock: p.stock }).subscribe(() => this.load(), () => alert('Không lưu được')); }
  del(p: any) { if (!confirm('Xóa sản phẩm?')) return; this.http.delete(`${environment.apiUrl}/products/${p._id}`).subscribe(() => this.load()); }
}
