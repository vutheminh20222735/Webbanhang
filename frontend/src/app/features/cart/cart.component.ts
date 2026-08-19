import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart: any = { items: [] };
  selectedIds = new Set<string>();
  busy = false;
  message = '';
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80';

  constructor(private cartSvc: CartService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(keepSelection = true) {
    this.cartSvc.getCart().subscribe(
      (res: any) => {
        this.cart = res.data || { items: [] };
        if (!keepSelection) this.selectedIds.clear();
        const ids = new Set((this.cart.items || []).map((it: any) => String(it._id)));
        this.selectedIds = new Set([...this.selectedIds].filter((id) => ids.has(id)));
      },
      () => this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } })
    );
  }

  itemId(it: any): string {
    return String(it?._id || '');
  }

  stockOf(it: any): number {
    const stock = it?.product?.stock ?? it?.stock;
    const n = Number(stock);
    return Number.isFinite(n) && n >= 0 ? n : 99;
  }

  imageOf(it: any): string {
    return it?.product?.images?.[0] || it?.image || this.placeholder;
  }

  nameOf(it: any): string {
    return it?.name || it?.product?.name || 'Sản phẩm';
  }

  priceOf(it: any): number {
    return Number(it?.priceAt || it?.price || it?.product?.salePrice || it?.product?.price || 0);
  }

  isSelected(it: any): boolean {
    return this.selectedIds.has(this.itemId(it));
  }

  toggleItem(it: any): void {
    const id = this.itemId(it);
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  isAllSelected(): boolean {
    const items = this.cart?.items || [];
    return !!items.length && items.every((it: any) => this.selectedIds.has(this.itemId(it)));
  }

  toggleAll(): void {
    const items = this.cart?.items || [];
    if (this.isAllSelected()) this.selectedIds.clear();
    else this.selectedIds = new Set(items.map((it: any) => this.itemId(it)));
  }

  selectedItems(): any[] {
    return (this.cart?.items || []).filter((it: any) => this.selectedIds.has(this.itemId(it)));
  }

  getSelectedTotal(): number {
    return this.selectedItems().reduce((total, item) => total + this.priceOf(item) * Number(item.quantity || 0), 0);
  }

  getCartTotal(): number {
    return (this.cart?.items || []).reduce((total: number, item: any) => total + this.priceOf(item) * Number(item.quantity || 0), 0);
  }

  increase(it: any) {
    const stock = this.stockOf(it);
    const next = Number(it.quantity || 1) + 1;
    if (next > stock) {
      this.message = `Chỉ còn ${stock} máy trong kho.`;
      return;
    }
    this.setQty(it, next);
  }

  decrease(it: any) {
    const next = Number(it.quantity || 1) - 1;
    if (next < 1) return;
    this.setQty(it, next);
  }

  onQtyInput(it: any, event: Event) {
    const raw = Number((event.target as HTMLInputElement).value);
    let qty = Number.isFinite(raw) ? Math.floor(raw) : 1;
    const stock = this.stockOf(it);
    if (qty < 1) qty = 1;
    if (qty > stock) {
      qty = stock;
      this.message = `Chỉ còn ${stock} máy trong kho.`;
    }
    (event.target as HTMLInputElement).value = String(qty);
    this.setQty(it, qty);
  }

  setQty(it: any, quantity: number) {
    if (this.busy) return;
    this.busy = true;
    this.cartSvc.update(this.itemId(it), quantity).subscribe({
      next: () => {
        this.busy = false;
        this.load();
      },
      error: (err) => {
        this.busy = false;
        this.message = err.error?.message || 'Không cập nhật được số lượng';
        this.load();
      }
    });
  }

  remove(it: any) {
    if (this.busy) return;
    if (!confirm('Xóa sản phẩm khỏi giỏ hàng?')) return;
    this.busy = true;
    this.cartSvc.remove(this.itemId(it)).subscribe({
      next: () => {
        this.busy = false;
        this.selectedIds.delete(this.itemId(it));
        this.load();
      },
      error: () => {
        this.busy = false;
        this.message = 'Không xóa được sản phẩm';
      }
    });
  }

  goToCheckout(): void {
    const selected = this.selectedItems();
    if (selected.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm.');
      return;
    }
    sessionStorage.setItem('checkoutItems', JSON.stringify(selected));
    this.router.navigate(['/checkout']);
  }

  continueShopping() {
    this.router.navigate(['/']);
  }
}
