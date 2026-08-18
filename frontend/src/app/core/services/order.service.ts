import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}
  list(params = {}) { return this.http.get(`${environment.apiUrl}/orders`, { params }); }
  get(id: string) { return this.http.get(`${environment.apiUrl}/orders/${id}`); }
}
