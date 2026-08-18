import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  template: `
    <h1>Products</h1>
    <div *ngFor="let p of products">{{p.name}} - {{p.price}}</div>
  `
})
export class ProductsListComponent implements OnInit {
  products: any[] = [];
  constructor(private http: HttpClient) {}
  ngOnInit() { this.http.get(`${environment.apiUrl}/products`).subscribe((res: any) => this.products = res.data?.items || []); }
}
