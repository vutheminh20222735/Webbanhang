import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  cart: any;
  selectedItems: any[] = [];

  constructor(
    private cartSvc: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartSvc.getCart().subscribe(
      (res: any) => {
        this.cart = res.data;
      },
      () => {
        this.router.navigate(['/login']);
      }
    );
  }

  isSelected(item: any): boolean {
    return this.selectedItems.includes(item);
  }

  toggleItem(item: any): void {
    const index = this.selectedItems.indexOf(item);

    if (index !== -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(item);
    }
  }

  isAllSelected(): boolean {
    return !!this.cart?.items?.length &&
           this.selectedItems.length === this.cart.items.length;
  }

  toggleAll(): void {
    if (!this.cart?.items?.length) return;

    if (this.isAllSelected()) {
      this.selectedItems = [];
    } else {
      this.selectedItems = [...this.cart.items];
    }
  }

  getSelectedTotal(): number {
    return this.selectedItems.reduce((total, item) => {
      return total + ((item.priceAt || item.price || 0) * item.quantity);
    }, 0);
  }

  goToCheckout(): void {
    if (this.selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm.');
      return;
    }

    sessionStorage.setItem(
      'checkoutItems',
      JSON.stringify(this.selectedItems)
    );

    this.router.navigate(['/checkout']);
  }
}