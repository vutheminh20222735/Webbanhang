import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  constructor(private http: HttpClient) {}
  getCart() { return this.http.get(`${environment.apiUrl}/cart`); }
  add(productId: string, quantity = 1, color?: string, storage?: string) { return this.http.post(`${environment.apiUrl}/cart/add`, { productId, quantity, color, storage }); }
  update(itemId: string, quantity: number) { return this.http.put(`${environment.apiUrl}/cart/item`, { itemId, quantity }); }
  remove(itemId: string) { return this.http.delete(`${environment.apiUrl}/cart/item/${itemId}`); }
  applyCoupon(code: string) { return this.http.post(`${environment.apiUrl}/cart/coupon`, { code }); }
  checkout(payload: any) { return this.http.post(`${environment.apiUrl}/cart/checkout`, payload); }
}
