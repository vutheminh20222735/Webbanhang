import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { catchError, concatMap, map, switchMap, tap, toArray } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface SavedAddress {
  _id?: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  district: string;
  isDefault?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private items: SavedAddress[] = [];
  private migrated = false;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private localKey(): string {
    const user = this.auth.getUserFromToken();
    const id = user?.id || user?._id;
    return 'phs_addresses_' + (id ? String(id) : 'guest');
  }

  list(): SavedAddress[] {
    return this.items;
  }

  getDefault(): SavedAddress | null {
    return this.items.find((a) => a.isDefault) || this.items[0] || null;
  }

  load(): Observable<SavedAddress[]> {
    if (!this.auth.getToken()) {
      this.items = [];
      return of([]);
    }
    return this.http.get(`${environment.apiUrl}/addresses`).pipe(
      switchMap((res: any) => {
        const items = (res?.data?.items || []) as SavedAddress[];
        const local = this.readLocal();
        if (!this.migrated && local.length && items.length === 0) {
          this.migrated = true;
          return this.migrateLocal$(local);
        }
        this.clearLocal();
        this.items = items;
        return of(items);
      }),
      catchError(() => {
        this.items = [];
        return of([]);
      })
    );
  }

  save(address: SavedAddress): Observable<SavedAddress> {
    const payload = {
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      city: address.city,
      district: address.district,
      isDefault: !!address.isDefault
    };
    const req$ = address._id
      ? this.http.put(`${environment.apiUrl}/addresses/${address._id}`, payload)
      : this.http.post(`${environment.apiUrl}/addresses`, payload);
    return req$.pipe(
      map((res: any) => res.data as SavedAddress),
      tap(() => this.load().subscribe())
    );
  }

  remove(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/addresses/${id}`).pipe(
      tap(() => this.load().subscribe())
    );
  }

  setDefault(id: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/addresses/${id}/set-default`, {}).pipe(
      tap(() => this.load().subscribe())
    );
  }

  private readLocal(): SavedAddress[] {
    const keys = [this.localKey()];
    if (keys[0] !== 'phs_addresses_guest') keys.push('phs_addresses_guest');
    const all: SavedAddress[] = [];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        for (const a of arr) {
          if (a && a.line1) all.push(a);
        }
      } catch {
        // ignore malformed local cache
      }
    }
    return all;
  }

  private clearLocal() {
    localStorage.removeItem(this.localKey());
    localStorage.removeItem('phs_addresses_guest');
  }

  private migrateLocal$(local: SavedAddress[]): Observable<SavedAddress[]> {
    return from(local).pipe(
      concatMap((a) => this.http.post(`${environment.apiUrl}/addresses`, {
        name: a.name,
        phone: a.phone,
        line1: a.line1,
        city: a.city,
        district: a.district,
        isDefault: !!a.isDefault
      }).pipe(catchError(() => of(null)))),
      toArray(),
      tap(() => this.clearLocal()),
      switchMap(() => this.http.get(`${environment.apiUrl}/addresses`).pipe(
        map((res: any) => (res?.data?.items || []) as SavedAddress[]),
        tap((items) => { this.items = items; })
      ))
    );
  }
}
