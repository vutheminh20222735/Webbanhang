import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';

@Component({
  template: `
    <h2>My Orders</h2>
    <div *ngFor="let o of orders">{{o.orderCode}} - {{o.total}} - {{o.orderStatus}}</div>
  `
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  constructor(private orderSvc: OrderService) {}
  ngOnInit() { this.orderSvc.list().subscribe((res: any) => this.orders = res.data?.items || []); }
}
