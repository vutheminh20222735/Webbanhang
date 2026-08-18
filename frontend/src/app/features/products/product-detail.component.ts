import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  template: `
    <div *ngIf="product">
      <h2>{{product.name}}</h2>
      <p>{{product.description}}</p>
      <p>Price: {{product.price}}</p>
      <button (click)="addToCart()">Add to cart</button>
      <div *ngIf="canReview" style="margin-top:12px">
        <h4>Write a review</h4>
        <label>Rating <input type="number" [(ngModel)]="rating" min="1" max="5" /></label>
        <input placeholder="Title" [(ngModel)]="title" />
        <textarea placeholder="Body" [(ngModel)]="body"></textarea>
        <button (click)="submitReview()">Submit Review</button>
      </div>
    </div>
  `
})
export class ProductDetailComponent implements OnInit, AfterViewInit {
  product: any;
  id: string;
  canReview = false;
  rating = 5;
  title = '';
  body = '';
  constructor(private route: ActivatedRoute, private ps: ProductService, private cart: CartService, private http: HttpClient, public auth: AuthService) {}
  ngOnInit() { this.id = this.route.snapshot.params['id']; this.ps.get(this.id).subscribe((res: any) => this.product = res.data); }
  addToCart() { this.cart.add(this.id, 1).subscribe(() => alert('Added to cart')); }
  ngAfterViewInit() { if (this.auth.getToken()) this.http.get(`${environment.apiUrl}/reviews/can-review/${this.id}`).subscribe((res: any) => this.canReview = !!res.data); }
  submitReview() {
    if (!this.auth.getToken()) return alert('Login required');
    this.http.post(`${environment.apiUrl}/reviews`, { product: this.id, rating: this.rating, title: this.title, body: this.body }).subscribe((res:any) => { alert('Review submitted'); this.canReview = false; }, err => alert('Failed'));
  }
}
