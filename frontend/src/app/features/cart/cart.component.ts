import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  template: `
    <h1>Giỏ hàng</h1>
    <div *ngIf="cart?.items?.length; else empty">
      <div class="cart-item" *ngFor="let it of cart.items">
        <div>
          <strong>{{it.name || it.product?.name}}</strong>
          <p>Số lượng: {{it.quantity}}</p>
        </div>
        <span>{{(it.priceAt || it.price || 0) * it.quantity | number}}₫</span>
      </div>
      <a routerLink="/checkout" class="btn-primary">Thanh toán</a>
    </div>
    <ng-template #empty>
      <p class="muted">Giỏ hàng trống.</p>
      <a routerLink="/" class="btn-primary">Mua điện thoại</a>
    </ng-template>
  `
})
export class CartComponent implements OnInit {
  cart: any;
  constructor(private cartSvc: CartService, private router: Router) {}
  ngOnInit() {
    this.cartSvc.getCart().subscribe((res: any) => this.cart = res.data, () => this.router.navigate(['/login']));
  }
}
