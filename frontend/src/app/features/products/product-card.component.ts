import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() product: any;
  wished = false;
  adding = false;
  added = false;
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';
  private sub?: Subscription;

  constructor(
    private cart: CartService,
    private auth: AuthService,
    private wishlist: WishlistService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.wishlist.items$.subscribe(() => this.syncWish());
  }

  ngOnChanges() {
    this.syncWish();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private syncWish() {
    this.wished = !!(this.product?._id && this.wishlist.has(this.product._id));
  }

  get image(): string {
    return this.product?.images?.[0] || this.placeholder;
  }

  get outOfStock(): boolean {
    return Number(this.product?.stock || 0) <= 0;
  }

  get discount(): number {
    const price = Number(this.product?.price || 0);
    const sale = Number(this.product?.salePrice || 0);
    if (!price || !sale || sale >= price) return 0;
    return Math.round(((price - sale) / price) * 100);
  }

  toggleWish(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.auth.getToken()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.wishlist.toggle(this.product).subscribe({
      next: (wished) => { this.wished = wished; },
      error: (err) => alert(err.error?.message || 'Không cập nhật được yêu thích')
    });
  }

  addToCart(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    if (this.outOfStock || this.adding) return;
    if (!this.auth.getToken()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.adding = true;
    this.cart.add(this.product._id, 1).subscribe({
      next: () => {
        this.adding = false;
        this.added = true;
        setTimeout(() => (this.added = false), 1600);
      },
      error: (err) => {
        this.adding = false;
        alert(err.error?.message || 'Không thêm được vào giỏ');
      }
    });
  }
}
