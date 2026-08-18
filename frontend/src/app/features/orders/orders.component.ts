import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  selectedOrder: any = null;
  isCanceling = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.http.get(`${environment.apiUrl}/orders`).subscribe(
      (res: any) => {
        this.orders = res.data?.items || [];
      },
      (err) => {
        console.error('Failed to load orders', err);
      }
    );
  }

  selectOrder(order: any) {
    this.selectedOrder = order;
  }

  viewDetail(order: any) {
    this.selectedOrder = order;
  }

  closeDetail() {
    this.selectedOrder = null;
  }

  canCancel(order: any): boolean {
    const status = order.orderStatus?.toLowerCase() || '';
    return ['pending', 'confirmed'].includes(status);
  }

  cancelOrder(order: any) {
    if (!confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    this.isCanceling = true;
    this.http
      .post(`${environment.apiUrl}/orders/${order._id}/cancel`, {})
      .subscribe(
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
}
