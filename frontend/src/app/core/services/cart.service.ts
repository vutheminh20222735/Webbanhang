import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  private countSubject = new BehaviorSubject<number>(0);
  count$ = this.countSubject.asObservable();

  constructor(private http: HttpClient) {}

  get count(): number {
    return this.countSubject.value;
  }

  getCart() {
    return this.http.get(`${environment.apiUrl}/cart`).pipe(
      tap((res: any) => this.syncCount(res?.data))
    );
  }

  refresh() {
    if (!localStorage.getItem('phs_token')) {
      this.countSubject.next(0);
      return;
    }
    this.getCart().subscribe({ error: () => this.countSubject.next(0) });
  }

  clearCount() {
    this.countSubject.next(0);
  }

  add(productId: string, quantity = 1, color?: string, storage?: string) {
    return this.http.post(`${environment.apiUrl}/cart/add`, { productId, quantity, color, storage }).pipe(
      tap((res: any) => this.syncCount(res?.data))
    );
  }

  update(itemId: string, quantity: number) {
    return this.http.put(`${environment.apiUrl}/cart/item`, { itemId, quantity }).pipe(
      tap((res: any) => this.syncCount(res?.data))
    );
  }

  remove(itemId: string) {
    return this.http.delete(`${environment.apiUrl}/cart/item/${itemId}`).pipe(
      tap((res: any) => this.syncCount(res?.data))
    );
  }

  applyCoupon(code: string, orderTotal?: number) {
    return this.http.post(`${environment.apiUrl}/coupons/apply`, { code, orderTotal });
  }

  checkout(payload: any) {
    return this.http.post(`${environment.apiUrl}/cart/checkout`, payload);
  }

  selectedItemIds(items: any[]): string[] {
    return (items || []).map((it) => String(it?._id || '')).filter(Boolean);
  }

  private syncCount(cart: any) {
    const items = cart?.items || [];
    const count = items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0);
    this.countSubject.next(count);
  }
}
