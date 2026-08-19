import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-account-reviews',
  templateUrl: './account-reviews.component.html',
  styles: [`
    h1 { margin-bottom: 8px; }
    .muted { color: #64748b; margin-bottom: 20px; }
    .product-grid { display: grid; gap: 12px; }
    .review-product {
      display: flex; gap: 12px; align-items: center;
      background: #fff; border-radius: 12px; padding: 12px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, .06);
    }
    .review-product img { width: 64px; height: 64px; object-fit: contain; background: #eef2ff; border-radius: 8px; }
    .review-product div { display: flex; flex-direction: column; gap: 4px; }
    .review-product span { color: #2563eb; font-size: 13px; font-weight: 600; }
    .empty-state { text-align: center; padding: 40px 16px; background: #fff; border-radius: 12px; }
  `]
})
export class AccountReviewsComponent implements OnInit {
  products: any[] = [];
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80';

  constructor(private orders: OrderService) {}

  ngOnInit() {
    this.orders.list().subscribe((res: any) => {
      const items = res.data?.items || res.data || [];
      const map = new Map<string, any>();
      items.forEach((order: any) => {
        (order.items || []).forEach((it: any) => {
          const product = it.productId || it.product;
          const id = product?._id || product || it.productId;
          const name = product?.name || it.name;
          if (!id || map.has(String(id))) return;
          map.set(String(id), {
            _id: typeof id === 'object' ? id._id : id,
            name,
            images: product?.images || []
          });
        });
      });
      this.products = Array.from(map.values());
    });
  }
}
