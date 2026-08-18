import { Component, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Chart from 'chart.js/auto';

@Component({
  template: `
    <h2>Admin Dashboard</h2>
    <div class="kpis">
      <div class="card">Revenue: {{summary?.totalRevenue | currency}}</div>
      <div class="card">Orders: {{summary?.totalOrders}}</div>
      <div class="card">Customers: {{summary?.totalCustomers}}</div>
      <div class="card">Products: {{summary?.totalProducts}}</div>
    </div>
    <div>
      <canvas id="revenueChart" width="800" height="300"></canvas>
    </div>
    <h3>Top Products</h3>
    <table>
      <tr><th>Product</th><th>Qty</th></tr>
      <tr *ngFor="let p of topProducts"><td>{{p.name}}</td><td>{{p.qty}}</td></tr>
    </table>
    <h3>Low Stock</h3>
    <table>
      <tr><th>Product</th><th>Stock</th></tr>
      <tr *ngFor="let l of lowStock"><td>{{l.name}}</td><td>{{l.stock}}</td></tr>
    </table>
    <div>
      <form (submit)="askAi($event)">
        <input name="q" placeholder="Hỏi AI admin (e.g. Doanh thu tháng này)" style="width:60%" />
        <button>Ask AI</button>
      </form>
      <div *ngIf="aiResp">AI: <pre>{{aiResp | json}}</pre></div>
    </div>
    <div style="margin-top:12px">
      <button (click)="exportReport('top-products','csv')">Export Top Products CSV</button>
      <button (click)="exportReport('top-products','excel')">Export Top Products Excel</button>
      <button (click)="exportReport('revenue','pdf')">Export Revenue PDF</button>
    </div>
  `,
  styles: [`.kpis{display:flex;gap:12px}.card{padding:12px;border:1px solid #ddd;border-radius:6px}`]
})
export class AdminDashboardComponent implements AfterViewInit {
  summary: any;
  topProducts: any[] = [];
  lowStock: any[] = [];
  aiResp: any;
  chart: any;
  constructor(private http: HttpClient) {}
  ngAfterViewInit() { this.loadSummary(); this.loadRevenue(); this.loadTopProducts(); this.loadLowStock(); }
  loadSummary() { this.http.get(`${environment.apiUrl}/admin/reports/summary`).subscribe((res: any) => this.summary = res.data); }
  loadRevenue() {
    const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 30);
    this.http.get(`${environment.apiUrl}/admin/reports/revenue`, { params: { from: from.toISOString(), to: to.toISOString() } }).subscribe((res: any) => {
      const data = res.data || [];
      const labels = data.map(d => d.date);
      const totals = data.map(d => d.total);
      const ctx: any = (document.getElementById('revenueChart') as HTMLCanvasElement).getContext('2d');
      if (this.chart) this.chart.destroy();
      this.chart = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Revenue', data: totals, borderColor: '#1976d2', backgroundColor: 'rgba(25,118,210,0.2)' }] } });
    });
  }
  loadTopProducts() { this.http.get(`${environment.apiUrl}/admin/reports/top-products`).subscribe((res: any) => this.topProducts = res.data || []); }
  loadLowStock() { this.http.get(`${environment.apiUrl}/admin/reports/low-stock`).subscribe((res: any) => this.lowStock = res.data || []); }
  askAi(e: Event) {
    e.preventDefault(); const form = e.target as HTMLFormElement; const q = (form.querySelector('input[name=q]') as HTMLInputElement).value; if (!q) return;
    this.http.post(`${environment.apiUrl}/ai/admin-chat`, { message: q }).subscribe((res: any) => this.aiResp = res.data, err => this.aiResp = { error: 'AI failed' });
    (form.querySelector('input') as HTMLInputElement).value = '';
  }
  exportReport(report: string, type: string) {
    const url = `${environment.apiUrl}/admin/reports/export?report=${report}&type=${type}`;
    this.http.get(url, { responseType: 'blob' as 'json' }).subscribe((blob: any) => {
      const a = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = `${report}.${type === 'excel' ? 'xlsx' : type === 'csv' ? 'csv' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    }, err => alert('Export failed'));
  }
}
