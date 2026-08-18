import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  template: `
    <div class="admin-card">
      <h3>Đơn hàng</h3>
      <table class="admin-table">
        <tr><th>Mã</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th><th></th></tr>
        <tr *ngFor="let o of orders">
          <td>{{o.orderCode}}</td>
          <td>{{o.user?.email || o.user}}</td>
          <td>{{o.total | number}}₫</td>
          <td>
            <select [(ngModel)]="o.orderStatus">
              <option *ngFor="let s of statuses" [value]="s">{{s}}</option>
            </select>
          </td>
          <td><button class="btn-ghost-dark" (click)="update(o)">Cập nhật</button></td>
        </tr>
      </table>
    </div>
  `
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  statuses = ['PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','CANCELLED','RETURNED'];
  constructor(private http: HttpClient, public auth: AuthService) {}
  ngOnInit() { this.load(); }
  load() { this.http.get(`${environment.apiUrl}/orders`).subscribe((res: any) => this.orders = res.data?.items || []); }
  update(o: any) { this.http.put(`${environment.apiUrl}/orders/${o._id}/status`, { status: o.orderStatus }).subscribe(() => this.load(), () => alert('Không cập nhật được')); }
}
