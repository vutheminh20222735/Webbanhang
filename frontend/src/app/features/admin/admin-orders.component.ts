import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ORDER_STATUSES,
  canonicalOrderStatus,
  nextOrderStatuses,
  orderStatusClass,
  orderStatusColor,
  orderStatusLabel
} from '../../core/utils/order-status';

@Component({
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  allOrders: any[] = [];
  selectedOrder: any = null;
  statuses = ORDER_STATUSES;
  filterStatus = '';
  searchQuery = '';
  isLoading = false;
  isUpdating = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private ordersApi: OrderService, public auth: AuthService) {}

  ngOnInit() {
    this.load();
  }

  load(keepSelectedId?: string, showSpinner = true) {
    if (showSpinner) this.isLoading = true;
    this.ordersApi.list({ limit: 100 }).subscribe(
      (res: any) => {
        this.allOrders = res.data?.items || [];
        this.applyFilters();
        this.isLoading = false;
        if (keepSelectedId) {
          const fresh = this.allOrders.find((o) => String(o._id) === String(keepSelectedId));
          if (fresh) this.selectedOrder = fresh;
        }
      },
      (err) => {
        console.error('Failed to load orders', err);
        this.isLoading = false;
      }
    );
  }

  applyFilters() {
    let filtered = [...this.allOrders];

    if (this.filterStatus) {
      filtered = filtered.filter(
        (o) => canonicalOrderStatus(o.orderStatus) === canonicalOrderStatus(this.filterStatus)
      );
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          (o.orderCode && o.orderCode.toLowerCase().includes(query)) ||
          (o._id && o._id.toLowerCase().includes(query)) ||
          (o.shippingAddress?.name && o.shippingAddress.name.toLowerCase().includes(query)) ||
          (o.shippingAddress?.phone && o.shippingAddress.phone.includes(query))
      );
    }

    this.orders = filtered;
  }

  countByStatus(status: string): number {
    return (this.allOrders || []).filter(
      (o) => canonicalOrderStatus(o.orderStatus) === canonicalOrderStatus(status)
    ).length;
  }

  selectOrder(order: any) {
    this.selectedOrder = order;
    this.ordersApi.get(order._id).subscribe(
      (res: any) => {
        if (res?.data) {
          this.selectedOrder = res.data;
          this.patchLocal(res.data);
        }
      },
      () => {}
    );
  }

  closeDetail() {
    this.selectedOrder = null;
  }

  updateOrderStatus(order: any, newStatus: string) {
    const next = canonicalOrderStatus(newStatus);
    if (canonicalOrderStatus(order.orderStatus) === next) return;

    this.isUpdating = true;
    this.ordersApi.updateStatus(order._id, next).subscribe(
      (res: any) => {
        this.isUpdating = false;
        const updated = res?.data;
        const savedStatus = canonicalOrderStatus(updated?.orderStatus || next);
        if (updated) {
          this.patchLocal(updated);
          this.selectedOrder = updated;
        } else {
          order.orderStatus = savedStatus;
          if (this.selectedOrder && this.selectedOrder._id === order._id) {
            this.selectedOrder = { ...this.selectedOrder, orderStatus: savedStatus };
          }
        }
        this.showMessage('Cập nhật trạng thái thành công', 'success');
        this.load(order._id, false);
      },
      (err) => {
        this.isUpdating = false;
        this.showMessage('Cập nhật thất bại: ' + (err.error?.message || err.message), 'error');
      }
    );
  }

  patchLocal(updated: any) {
    if (!updated?._id) return;
    const apply = (list: any[]) =>
      list.map((o) => (String(o._id) === String(updated._id) ? { ...o, ...updated } : o));
    this.allOrders = apply(this.allOrders);
    this.applyFilters();
  }

  getStatusLabel(status: string | undefined): string {
    return orderStatusLabel(status);
  }

  getStatusColor(status: string | undefined): string {
    return orderStatusColor(status);
  }

  getStatusClass(status: string | undefined): string {
    return orderStatusClass(status);
  }

  getNextStatuses(currentStatus: string | undefined): string[] {
    return nextOrderStatuses(currentStatus);
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
