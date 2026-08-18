import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  template: `
    <h3>Manage Products</h3>
    <table>
      <tr><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
      <tr *ngFor="let p of products">
        <td>{{p.name}}</td>
        <td><input [(ngModel)]="p.price" /></td>
        <td><input [(ngModel)]="p.stock" /></td>
        <td>
          <button (click)="save(p)" *ngIf="auth.hasRole('ADMIN','MANAGER')">Save</button>
          <button (click)="del(p)" *ngIf="auth.hasRole('ADMIN')">Delete</button>
        </td>
      </tr>
    </table>
  `
})
export class AdminProductsComponent implements OnInit {
  products: any[] = [];
  constructor(private http: HttpClient, public auth: AuthService) {}
  ngOnInit() { this.load(); }
  load() { this.http.get(`${environment.apiUrl}/products`).subscribe((res: any) => this.products = res.data?.items || []); }
  save(p: any) { this.http.put(`${environment.apiUrl}/products/${p._id}`, p).subscribe(() => this.load()); }
  del(p: any) { if(!confirm('Delete?')) return; this.http.delete(`${environment.apiUrl}/products/${p._id}`).subscribe(()=> this.load()); }
}
