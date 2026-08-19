import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private itemsSubject = new BehaviorSubject<any[]>([]);
  items$ = this.itemsSubject.asObservable();
  private migrated = false;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private localKey(): string {
    const user = this.auth.getUserFromToken();
    const id = user?.id || user?._id;
    return 'phs_wishlist_' + (id ? String(id) : 'guest');
  }

  list(): any[] {
    return this.itemsSubject.value;
  }

  has(productId: string): boolean {
    return this.list().some((p) => p && String(p._id) === String(productId));
  }

  reload() {
    if (!this.auth.getToken()) {
      this.itemsSubject.next([]);
      return;
    }
    this.http.get(`${environment.apiUrl}/wishlist`).pipe(
      catchError(() => of({ data: { items: [] } }))
    ).subscribe((res: any) => {
      const items = res?.data?.items || [];
      const local = this.readLocal();
      if (!this.migrated && local.length && items.length === 0) {
        this.migrated = true;
        this.migrateLocal(local);
        return;
      }
      this.clearLocal();
      this.itemsSubject.next(items);
    });
  }

  add(product: any): Observable<any[]> {
    if (!product || !product._id) return of(this.list());
    return this.http.post(`${environment.apiUrl}/wishlist`, { productId: product._id }).pipe(
      map((res: any) => res?.data?.items || []),
      tap((items) => this.itemsSubject.next(items))
    );
  }

  remove(productId: string): Observable<any[]> {
    return this.http.delete(`${environment.apiUrl}/wishlist/${productId}`).pipe(
      map((res: any) => res?.data?.items || []),
      tap((items) => this.itemsSubject.next(items))
    );
  }

  toggle(product: any): Observable<boolean> {
    if (!product || !product._id) return of(false);
    if (this.has(product._id)) {
      return this.remove(product._id).pipe(map(() => false));
    }
    return this.add(product).pipe(map(() => true));
  }

  clear(): Observable<any[]> {
    return this.http.delete(`${environment.apiUrl}/wishlist`).pipe(
      map((res: any) => res?.data?.items || []),
      tap((items) => this.itemsSubject.next(items))
    );
  }

  private readLocal(): any[] {
    const keys = [this.localKey()];
    if (keys[0] !== 'phs_wishlist_guest') keys.push('phs_wishlist_guest');
    const all: any[] = [];
    const seen = new Set<string>();
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        for (const p of arr) {
          if (p && p._id && !seen.has(String(p._id))) {
            seen.add(String(p._id));
            all.push(p);
          }
        }
      } catch {
        // ignore malformed local cache
      }
    }
    return all;
  }

  private clearLocal() {
    localStorage.removeItem(this.localKey());
    localStorage.removeItem('phs_wishlist_guest');
  }

  private migrateLocal(local: any[]) {
    const adds = local
      .filter((p) => p && p._id)
      .map((p) => this.http.post(`${environment.apiUrl}/wishlist`, { productId: p._id }).pipe(catchError(() => of(null))));
    if (!adds.length) {
      this.itemsSubject.next([]);
      return;
    }
    adds.reduce((acc, cur) => acc.pipe(switchMap(() => cur)), of(null)).subscribe(() => {
      this.clearLocal();
      this.http.get(`${environment.apiUrl}/wishlist`).subscribe((res: any) => {
        this.itemsSubject.next(res?.data?.items || []);
      });
    });
  }
}
