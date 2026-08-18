import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  allOrders: any[] = [];
  selectedOrder: any = null;
  statuses = ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'canceled', 'returned'];
  filterStatus = '';
  searchQuery = '';
  isLoading = false;
  isUpdating = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, public auth: AuthService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.http.get(`${environment.apiUrl}/orders?limit=100`).subscribe(
      (res: any) => {
        this.allOrders = res.data?.items || [];
        this.applyFilters();
        this.isLoading = false;
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
      filtered = filtered.filter((o) => (o.orderStatus || 'pending').toLowerCase() === this.filterStatus.toLowerCase());
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

  selectOrder(order: any) {
    this.selectedOrder = order;
  }

  closeDetail() {
    this.selectedOrder = null;
  }

  updateOrderStatus(order: any, newStatus: string) {
    if (order.orderStatus === newStatus) return;

    this.isUpdating = true;
    this.http
      .put(`${environment.apiUrl}/orders/${order._id}/status`, { orderStatus: newStatus })
      .subscribe(
        (res: any) => {
          this.isUpdating = false;
          this.showMessage('Cập nhật trạng thái thành công', 'success');
          order.orderStatus = newStatus;
          this.load();
        },
        (err) => {
          this.isUpdating = false;
          this.showMessage('Cập nhật thất bại: ' + (err.error?.message || err.message), 'error');
        }
      );
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Chờ xác nhận';
    const statusMap: { [key: string]: string } = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      canceled: 'Đã hủy',
      returned: 'Trả hàng'
    };
    return statusMap[status.toLowerCase()] || status;
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return '#fbbf24';
    const colorMap: { [key: string]: string } = {
      pending: '#fbbf24',
      confirmed: '#3b82f6',
      preparing: '#8b5cf6',
      shipping: '#10b981',
      delivered: '#059669',
      canceled: '#ef4444',
      returned: '#f97316'
    };
    return colorMap[status.toLowerCase()] || '#6b7280';
  }

  getNextStatuses(currentStatus: string | undefined): string[] {
    const current = (currentStatus || 'pending').toLowerCase();
    const transitions: { [key: string]: string[] } = {
      pending: ['confirmed', 'canceled'],
      confirmed: ['preparing', 'canceled'],
      preparing: ['shipping', 'canceled'],
      shipping: ['delivered', 'returned'],
      delivered: ['returned'],
      canceled: [],
      returned: []
    };
    return transitions[current] || [];
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}

