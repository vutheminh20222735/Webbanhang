import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'phs_token';
  user$ = new BehaviorSubject(null);

  constructor(private http: HttpClient) {
    const token = localStorage.getItem(this.tokenKey);
    if (token) { /* optionally validate and set user */ }
  }

  login(email: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/login`, { email, password });
  }

  register(payload: any) {
    return this.http.post(`${environment.apiUrl}/auth/register`, payload);
  }

  me() {
    return this.http.get(`${environment.apiUrl}/auth/me`);
  }

  updateProfile(payload: any) {
    return this.http.put(`${environment.apiUrl}/auth/profile`, payload);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post(`${environment.apiUrl}/auth/change-password`, { currentPassword, newPassword });
  }

  forgotPassword(email: string) {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  setToken(token: string) { localStorage.setItem(this.tokenKey, token); }
  getToken() { return localStorage.getItem(this.tokenKey); }
  logout() { localStorage.removeItem(this.tokenKey); this.user$.next(null); }
  getUserFromToken() {
    const token = this.getToken();
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  }
  hasRole(...roles: string[]) {
    const u = this.getUserFromToken(); if (!u) return false; return roles.includes(u.role);
  }
  hasPermission(permission: string) {
    const u = this.getUserFromToken(); if (!u) return false; return Array.isArray(u.permissions) && u.permissions.includes(permission);
  }
}
