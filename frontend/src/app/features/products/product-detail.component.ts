import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: any;
  id: string;
  qty = 1;
  loading = true;
  error = '';
  cartMessage = '';
  wished = false;
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ps: ProductService,
    private cart: CartService,
    public auth: AuthService,
    private wishlist: WishlistService
  ) {}

  get loggedIn() { return !!this.auth.getToken(); }
  get currentUrl() { return this.router.url; }

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.wishlist.items$.subscribe(() => {
      this.wished = this.wishlist.has(this.id);
    });
    this.ps.get(this.id).subscribe((res: any) => {
      this.loading = false;
      this.product = res.data;
      this.wished = this.wishlist.has(this.id);
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

  clampQty() {
    const stock = Number(this.product?.stock || 0);
    if (this.qty < 1) this.qty = 1;
    if (stock && this.qty > stock) this.qty = stock;
  }

  addToCart() {
    if (!this.requireLogin()) return;
    this.clampQty();
    this.cart.add(this.id, this.qty).subscribe({
      next: () => {
        this.cartMessage = 'Đã thêm vào giỏ hàng.';
        this.router.navigate(['/cart']);
      },
      error: (err) => alert(err.error?.message || 'Không thêm được vào giỏ')
    });
  }

  buyNow() {
    if (!this.requireLogin()) return;
    this.clampQty();
    this.cart.add(this.id, this.qty).subscribe({
      next: (res: any) => {
        const items = res.data?.items || [];
        const current = items.find((it: any) => String(it.product?._id || it.product) === String(this.id)) || items[items.length - 1];
        if (current) sessionStorage.setItem('checkoutItems', JSON.stringify([current]));
        this.router.navigate(['/checkout']);
      },
      error: () => alert('Không mua được, thử lại')
    });
  }

  toggleWish() {
    if (!this.requireLogin()) return;
    this.wishlist.toggle(this.product).subscribe({
      next: (wished) => { this.wished = wished; },
      error: (err) => alert(err.error?.message || 'Không cập nhật được yêu thích')
    });
  }
}
