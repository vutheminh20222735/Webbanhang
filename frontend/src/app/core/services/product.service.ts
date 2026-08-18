import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}
  list(params = {}) { return this.http.get(`${environment.apiUrl}/products`, { params }); }
  get(id: string) { return this.http.get(`${environment.apiUrl}/products/${id}`); }
}
