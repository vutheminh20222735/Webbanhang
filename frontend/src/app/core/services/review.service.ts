import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  listByProduct(productId: string) {
    return this.http.get(`${environment.apiUrl}/reviews/product/${productId}`);
  }

  canReview(productId: string) {
    return this.http.get(`${environment.apiUrl}/reviews/can-review/${productId}`);
  }

  create(payload: { product: string; rating: number; title?: string; body: string }) {
    return this.http.post(`${environment.apiUrl}/reviews`, payload);
  }
}
