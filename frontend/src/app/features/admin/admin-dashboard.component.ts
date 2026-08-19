import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { orderStatusColor, orderStatusLabel } from '../../core/utils/order-status';
import Chart from 'chart.js/auto';

@Component({
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  isLoading = false;
  loadError = '';

  totalRevenue = 0;
  totalOrders = 0;
  totalCustomers = 0;
  totalProducts = 0;
  successRate = 0;
  todayRevenue = 0;
  todayOrders = 0;
  lowStockThreshold = 10;

  revenueChart: any;
  statusChart: any;

  topProducts: any[] = [];
  lowStock: any[] = [];
  ordersByStatus: any[] = [];
  categoryData: any[] = [];
  revenueData: any[] = [];

  selectedRange = '30days';

  constructor(private http: HttpClient, public auth: AuthService) {}

  get canReport() {
    return this.auth.hasRole('ADMIN', 'MANAGER');
  }

  get canExport() {
    return this.auth.hasRole('ADMIN');
  }

  ngOnInit() {
    if (!this.canReport) return;
    this.loadAllData();
  }

  ngOnDestroy() {
    this.revenueChart?.destroy();
    this.statusChart?.destroy();
  }

  loadAllData() {
    this.isLoading = true;
    this.loadError = '';
    this.http
      .get(`${environment.apiUrl}/admin/dashboard?range=${this.selectedRange}`)
      .subscribe(
        (res: any) => {
          const data = res.data || {};

          this.totalRevenue = Number(data.totalRevenue || 0);
          this.totalOrders = Number(data.totalOrders || 0);
          this.totalCustomers = Number(data.totalCustomers || 0);
          this.totalProducts = Number(data.totalProducts || 0);
          this.successRate = Number(data.successRate || 0);
          this.todayRevenue = Number(data.todayRevenue || 0);
          this.todayOrders = Number(data.todayOrders || 0);
          this.lowStockThreshold = Number(data.lowStockThreshold || 10);

          this.revenueData = data.revenueChart || data.revenueData || [];
          this.categoryData = data.categoryData || [];
          this.topProducts = (data.topProducts || []).map((p: any) => ({
            ...p,
            quantity: p.quantity ?? p.qty ?? p.sold ?? 0,
            revenue: p.revenue ?? 0
          }));
          this.ordersByStatus = data.ordersByStatus || [];
          this.lowStock = data.lowStock || [];

          this.isLoading = false;
          setTimeout(() => this.renderCharts(), 0);
        },
        (err) => {
          console.error('Failed to load dashboard', err);
          this.loadError = err.error?.message || 'Không tải được dashboard';
          this.isLoading = false;
        }
      );
  }

  renderCharts() {
    this.renderRevenueChart();
    this.renderStatusChart();
  }

  renderRevenueChart() {
    const element = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!element) return;

    const labels = this.revenueData.map((d) => d.date || d.label);
    const data = this.revenueData.map((d) => Number(d.total || d.value || 0));

    if (this.revenueChart) this.revenueChart.destroy();

    const ctx = element.getContext('2d');
    this.revenueChart = new Chart(ctx as any, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Doanh thu (₫)',
            data,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: labels.length > 40 ? 0 : 3,
            pointBackgroundColor: '#2563eb'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { usePointStyle: true, padding: 15 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => Number(value).toLocaleString('vi-VN') + ' ₫'
            }
          }
        }
      }
    });
  }

  renderStatusChart() {
    const element = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!element) return;

    const rows = (this.ordersByStatus || []).filter((s) => Number(s.count || 0) > 0);
    const source = rows.length ? rows : this.ordersByStatus;
    const labels = source.map((s) => this.getStatusLabel(s.status));
    const data = source.map((s) => Number(s.count || 0));
    const colors = source.map((s) => this.getStatusColor(s.status));

    if (this.statusChart) this.statusChart.destroy();

    const ctx = element.getContext('2d');
    this.statusChart = new Chart(ctx as any, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' as any }
        }
      }
    });
  }

  getStatusLabel(status: string): string {
    return orderStatusLabel(status);
  }

  getStatusColor(status: string): string {
    return orderStatusColor(status);
  }

  exportReport(format: 'csv' | 'pdf' | 'excel') {
    const url = `${environment.apiUrl}/admin/reports/export?format=${format}&type=${format}&range=${this.selectedRange}`;
    window.location.href = url;
  }

  onRangeChange() {
    this.loadAllData();
  }

  getTotalOrders(): number {
    return (this.ordersByStatus || []).reduce((sum, item) => sum + Number(item.count || 0), 0);
  }

  getPercentage(count: number): number {
    const total = this.getTotalOrders();
    return total > 0 ? (count / total) * 100 : 0;
  }
}
