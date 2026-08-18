import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';

@Component({
  template: `
    <h2>Cart</h2>
    <div *ngIf="cart?.items?.length; else empty">
      <div *ngFor="let it of cart.items">{{it.name}} x {{it.quantity}} - {{it.priceAt}}</div>
    </div>
    <ng-template #empty><p>Your cart is empty</p></ng-template>
  `
})
export class CartComponent implements OnInit {
  cart: any;
  constructor(private cartSvc: CartService) {}
  ngOnInit() { this.cartSvc.getCart().subscribe((res: any) => this.cart = res.data); }
}
