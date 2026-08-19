import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private http: HttpClient) {}
  chat(message: string, history: Array<{ role: string; text: string }> = []) {
    return this.http.post(`${environment.apiUrl}/ai/chat`, { message, history });
  }
  adminChat(message: string, history: Array<{ role: string; text: string }> = []) {
    return this.http.post(`${environment.apiUrl}/ai/admin-chat`, { message, history });
  }
}
