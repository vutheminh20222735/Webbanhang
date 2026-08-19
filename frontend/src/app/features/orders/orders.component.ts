import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';
import {
  canonicalOrderStatus,
  orderStatusClass,
  orderStatusLabel,
  orderTimeline
} from '../../core/utils/order-status';

@Component({
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  selectedOrder: any = null;
  isCanceling = false;
  isLoading = false;

  constructor(private ordersApi: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders(keepSelectedId?: string) {
    this.isLoading = true;
    this.ordersApi.list({ limit: 100 }).subscribe(
      (res: any) => {
        this.orders = res.data?.items || [];
        this.isLoading = false;
        if (keepSelectedId) {
          const fresh = this.orders.find((o) => String(o._id) === String(keepSelectedId));
          if (fresh) this.selectedOrder = fresh;
        }
      },
      (err) => {
        console.error('Failed to load orders', err);
        this.isLoading = false;
      }
    );
  }

  selectOrder(order: any) {
    this.viewDetail(order);
  }

  viewDetail(order: any) {
    this.selectedOrder = order;
    this.ordersApi.get(order._id).subscribe(
      (res: any) => {
        if (res?.data) {
          this.selectedOrder = res.data;
          this.orders = this.orders.map((o) =>
            String(o._id) === String(res.data._id) ? { ...o, ...res.data } : o
          );
        }
      },
      () => {}
    );
  }

  closeDetail() {
    this.selectedOrder = null;
  }

  canCancel(order: any): boolean {
    const status = canonicalOrderStatus(order?.orderStatus);
    return status === 'PENDING' || status === 'CONFIRMED';
  }

  cancelOrder(order: any) {
    if (!confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    this.isCanceling = true;
    this.ordersApi.cancel(order._id).subscribe(
      (res: any) => {
        this.isCanceling = false;
        alert('Hủy đơn hàng thành công');
        this.loadOrders();
        this.closeDetail();
      },
      (err) => {
        this.isCanceling = false;
        alert('Hủy đơn hàng thất bại: ' + (err.error?.message || err.message));
      }
    );
  }

  getStatusLabel(status: string | undefined): string {
    return orderStatusLabel(status);
  }

  getStatusClass(status: string | undefined): string {
    return orderStatusClass(status);
  }

  getTimeline(status: string | undefined) {
    return orderTimeline(status);
  }
}
