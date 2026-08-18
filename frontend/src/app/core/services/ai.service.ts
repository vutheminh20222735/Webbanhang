import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private http: HttpClient) {}
  chat(message: string) { return this.http.post(`${environment.apiUrl}/ai/chat`, { message }); }
  adminChat(message: string) { return this.http.post(`${environment.apiUrl}/ai/admin-chat`, { message }); }
}
