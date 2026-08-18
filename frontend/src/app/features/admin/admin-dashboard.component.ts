import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import Chart from 'chart.js/auto';

@Component({
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  isLoading = false;

  // KPI Cards
  totalRevenue = 0;
  totalOrders = 0;
  totalCustomers = 0;
  totalProducts = 0;
  successRate = 0;

  // Today
  todayRevenue = 0;
  todayOrders = 0;

  // Charts
  revenueChart: any;
  statusChart: any;

  // Data
  topProducts: any[] = [];
  lowStock: any[] = [];
  ordersByStatus: any[] = [];
  categoryData: any[] = [];
  revenueData: any[] = [];

  // Time Range
  selectedRange = '30days';

  constructor(private http: HttpClient, public auth: AuthService) {}

  get canReport() {
    return this.auth.hasRole('ADMIN', 'MANAGER');
  }

  ngOnInit() {
    if (!this.canReport) return;
    this.loadAllData();
  }

  ngAfterViewInit() {
    if (!this.canReport) return;
    setTimeout(() => {
      this.renderCharts();
    }, 100);
  }

  loadAllData() {
    this.isLoading = true;
    this.http
      .get(`${environment.apiUrl}/admin/dashboard?range=${this.selectedRange}`)
      .subscribe(
        (res: any) => {
          const data = res.data || {};

          this.totalRevenue = data.totalRevenue || 0;
          this.totalOrders = data.totalOrders || 0;
          this.totalCustomers = data.totalCustomers || 0;
          this.totalProducts = data.totalProducts || 0;
          this.successRate = data.successRate || 0;
          this.todayRevenue = data.todayRevenue || 0;
          this.todayOrders = data.todayOrders || 0;

          this.revenueData = data.revenueChart || [];
          this.categoryData = data.categoryData || [];
          this.topProducts = data.topProducts || [];
          this.ordersByStatus = data.ordersByStatus || [];

          this.isLoading = false;
          this.renderCharts();
        },
        (err) => {
          console.error('Failed to load dashboard', err);
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
    const data = this.revenueData.map((d) => d.total || d.value);

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
            pointRadius: 4,
            pointBackgroundColor: '#2563eb'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => value.toLocaleString('vi-VN') + ' ₫'
            }
          }
        }
      }
    });
  }

  renderStatusChart() {
    const element = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!element) return;

    const labels = this.ordersByStatus.map((s) => this.getStatusLabel(s.status));
    const data = this.ordersByStatus.map((s) => s.count);
    const colors = this.ordersByStatus.map((s) => this.getStatusColor(s.status));

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
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom' as any
          }
        }
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      canceled: 'Đã hủy'
    };
    return labels[status?.toLowerCase()] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: '#fbbf24',
      confirmed: '#3b82f6',
      preparing: '#8b5cf6',
      shipping: '#10b981',
      delivered: '#059669',
      canceled: '#ef4444'
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  }

  exportReport(format: 'csv' | 'pdf' | 'excel') {
    const url = `${environment.apiUrl}/admin/export?format=${format}&range=${this.selectedRange}`;
    window.location.href = url;
  }

  onRangeChange() {
    this.loadAllData();
  }

  getTotalOrders(): number {
    return (this.ordersByStatus || []).reduce((sum, item) => sum + (item.count || 0), 0);
  }

  getPercentage(count: number): number {
    const total = this.getTotalOrders();
    return total > 0 ? (count / total) * 100 : 0;
  }
}
