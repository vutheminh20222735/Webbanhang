import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, AfterViewInit {
  product: any;
  id: string;
  qty = 1;
  loading = true;
  error = '';
  canReview = false;
  rating = 5;
  title = '';
  body = '';
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
  constructor(private route: ActivatedRoute, private router: Router, private ps: ProductService, private cart: CartService, private http: HttpClient, public auth: AuthService) {}
  get loggedIn() { return !!this.auth.getToken(); }
  get currentUrl() { return this.router.url; }
  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.ps.get(this.id).subscribe((res: any) => {
      this.loading = false;
      this.product = res.data;
    }, err => {
      this.loading = false;
      this.error = err.error?.message || 'Không tải được thông tin điện thoại.';
    });
  }
  requireLogin(): boolean {
    if (this.auth.getToken()) return true;
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return false;
  }
  addToCart() {
    if (!this.requireLogin()) return;
    this.cart.add(this.id, this.qty).subscribe(() => this.router.navigate(['/cart']), () => alert('Không thêm được vào giỏ'));
  }
  buyNow() {
    if (!this.requireLogin()) return;
    this.cart.add(this.id, this.qty).subscribe(() => this.router.navigate(['/checkout']), () => alert('Không mua được, thử lại'));
  }
  ngAfterViewInit() { if (this.auth.getToken()) this.http.get(`${environment.apiUrl}/reviews/can-review/${this.id}`).subscribe((res: any) => this.canReview = !!res.data); }
}
