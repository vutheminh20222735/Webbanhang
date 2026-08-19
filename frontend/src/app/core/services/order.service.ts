import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  list(params: Record<string, string | number> = {}) {
    return this.http.get(`${environment.apiUrl}/orders`, { params });
  }

  get(id: string) {
    return this.http.get(`${environment.apiUrl}/orders/${id}`);
  }

  updateStatus(id: string, status: string) {
    return this.http.put(`${environment.apiUrl}/orders/${id}/status`, {
      status,
      orderStatus: status
    });
  }

  cancel(id: string) {
    return this.http.post(`${environment.apiUrl}/orders/${id}/cancel`, {});
  }
}
