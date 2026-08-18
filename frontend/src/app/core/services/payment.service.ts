import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}
  create(orderId: string, method = 'CARD') { return this.http.post(`${environment.apiUrl}/payments/create`, { orderId, method }); }
  refund(paymentId: string) { return this.http.post(`${environment.apiUrl}/payments/${paymentId}/refund`, {}); }
}
