import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  template: `
    <h3>Manage Orders</h3>
    <table>
      <tr><th>Code</th><th>User</th><th>Total</th><th>Status</th><th>Actions</th></tr>
      <tr *ngFor="let o of orders">
        <td>{{o.orderCode}}</td>
        <td>{{o.user?.email}}</td>
        <td>{{o.total}}</td>
        <td>
          <select [(ngModel)]="o.orderStatus">
            <option *ngFor="let s of statuses" [value]="s">{{s}}</option>
          </select>
        </td>
        <td><button (click)="update(o)" *ngIf="auth.hasRole('ADMIN','MANAGER','STAFF')">Update</button></td>
      </tr>
    </table>
  `
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  statuses = ['PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','CANCELLED','RETURNED'];
  constructor(private http: HttpClient, public auth: AuthService) {}
  ngOnInit() { this.load(); }
  load() { this.http.get(`${environment.apiUrl}/orders`).subscribe((res: any) => this.orders = res.data?.items || []); }
  update(o: any) { this.http.put(`${environment.apiUrl}/orders/${o._id}/status`, { status: o.orderStatus }).subscribe(() => this.load()); }
}
