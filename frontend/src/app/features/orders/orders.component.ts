import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';

@Component({
  template: `
    <h1>Đơn hàng của tôi</h1>
    <div class="cart-item" *ngFor="let o of orders">
      <strong>{{o.orderCode}}</strong>
      <span>{{o.total | number}}₫ · {{o.orderStatus}}</span>
    </div>
    <p *ngIf="!orders.length" class="muted">Chưa có đơn hàng.</p>
  `
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  constructor(private orderSvc: OrderService) {}
  ngOnInit() { this.orderSvc.list().subscribe((res: any) => this.orders = res.data?.items || []); }
}
