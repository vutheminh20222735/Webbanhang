import { Component, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import Chart from 'chart.js/auto';

@Component({
  template: `
    <p class="muted" *ngIf="!canReport">Tài khoản nhân viên: xử lý đơn hàng và xem sản phẩm. Báo cáo chỉ dành cho quản trị/quản lý.</p>
    <ng-container *ngIf="canReport">
      <div class="kpi-grid">
        <div class="kpi"><span>Doanh thu</span><strong>{{summary?.totalRevenue | number}}₫</strong></div>
        <div class="kpi"><span>Đơn hàng</span><strong>{{summary?.totalOrders || 0}}</strong></div>
        <div class="kpi"><span>Khách hàng</span><strong>{{summary?.totalCustomers || 0}}</strong></div>
        <div class="kpi"><span>Sản phẩm</span><strong>{{summary?.totalProducts || 0}}</strong></div>
      </div>
      <div class="admin-card">
        <h3>Doanh thu 30 ngày</h3>
        <canvas id="revenueChart" height="120"></canvas>
      </div>
      <div class="admin-two">
        <div class="admin-card">
          <h3>Bán chạy</h3>
          <table class="admin-table">
            <tr><th>Sản phẩm</th><th>SL</th></tr>
            <tr *ngFor="let p of topProducts"><td>{{p.name}}</td><td>{{p.qty}}</td></tr>
          </table>
        </div>
        <div class="admin-card">
          <h3>Sắp hết hàng</h3>
          <table class="admin-table">
            <tr><th>Sản phẩm</th><th>Tồn</th></tr>
            <tr *ngFor="let l of lowStock"><td>{{l.name}}</td><td>{{l.stock}}</td></tr>
          </table>
        </div>
      </div>
      <div class="admin-card">
        <button class="btn-ghost-dark" (click)="exportReport('top-products','csv')">Xuất CSV</button>
        <button class="btn-ghost-dark" (click)="exportReport('top-products','excel')">Xuất Excel</button>
        <button class="btn-ghost-dark" (click)="exportReport('revenue','pdf')">Xuất PDF</button>
      </div>
    </ng-container>
  `
})
export class AdminDashboardComponent implements AfterViewInit {
  summary: any;
  topProducts: any[] = [];
  lowStock: any[] = [];
  chart: any;
  constructor(private http: HttpClient, public auth: AuthService) {}
  get canReport() { return this.auth.hasRole('ADMIN', 'MANAGER'); }
  ngAfterViewInit() {
    if (!this.canReport) return;
    this.loadSummary(); this.loadRevenue(); this.loadTopProducts(); this.loadLowStock();
  }
  loadSummary() { this.http.get(`${environment.apiUrl}/admin/reports/summary`).subscribe((res: any) => this.summary = res.data); }
  loadRevenue() {
    const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 30);
    this.http.get(`${environment.apiUrl}/admin/reports/revenue`, { params: { from: from.toISOString(), to: to.toISOString() } }).subscribe((res: any) => {
      const data = res.data || [];
      const labels = data.map((d: any) => d.date);
      const totals = data.map((d: any) => d.total);
      const el = document.getElementById('revenueChart') as HTMLCanvasElement;
      if (!el) return;
      const ctx = el.getContext('2d');
      if (this.chart) this.chart.destroy();
      this.chart = new Chart(ctx as any, { type: 'line', data: { labels, datasets: [{ label: 'Doanh thu', data: totals, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.15)', fill: true, tension: 0.3 }] } });
    });
  }
  loadTopProducts() { this.http.get(`${environment.apiUrl}/admin/reports/top-products`).subscribe((res: any) => this.topProducts = res.data || []); }
  loadLowStock() { this.http.get(`${environment.apiUrl}/admin/reports/low-stock`).subscribe((res: any) => this.lowStock = res.data || []); }
  exportReport(report: string, type: string) {
    const url = `${environment.apiUrl}/admin/reports/export?report=${report}&type=${type}`;
    this.http.get(url, { responseType: 'blob' as 'json' }).subscribe((blob: any) => {
      const a = document.createElement('a');
      const href = window.URL.createObjectURL(blob);
      a.href = href;
      a.download = `${report}.${type === 'excel' ? 'xlsx' : type === 'csv' ? 'csv' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(href);
    }, () => alert('Xuất báo cáo thất bại'));
  }
}
