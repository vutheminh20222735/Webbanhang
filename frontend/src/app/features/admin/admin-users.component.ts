import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  template: `
    <div class="admin-two">
      <div class="admin-card">
        <h3>Cấp tài khoản nhân viên</h3>
        <p class="muted">Nhân viên không tự đăng ký được. Chỉ admin tạo tài khoản STAFF/MANAGER.</p>
        <form (submit)="create($event)">
          <input name="name" placeholder="Họ tên" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Mật khẩu" required minlength="6" />
          <select name="role">
            <option value="STAFF">Nhân viên (STAFF)</option>
            <option value="MANAGER">Quản lý (MANAGER)</option>
          </select>
          <p class="error" *ngIf="error">{{error}}</p>
          <p class="ok" *ngIf="ok">{{ok}}</p>
          <button class="btn-primary" type="submit">Tạo tài khoản</button>
        </form>
      </div>
      <div class="admin-card">
        <h3>Danh sách tài khoản ({{total}})</h3>
        <table class="admin-table">
          <tr><th>Tên</th><th>Email</th><th>Vai trò</th></tr>
          <tr *ngFor="let u of users">
            <td>{{u.name}}</td>
            <td>{{u.email}}</td>
            <td><span class="badge">{{u.role}}</span></td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  total = 0;
  error = '';
  ok = '';
  constructor(private http: HttpClient) {}
  ngOnInit() { this.load(); }
  load() {
    this.http.get(`${environment.apiUrl}/admin/users`).subscribe((res: any) => {
      this.users = res.data?.users || [];
      this.total = res.data?.total || 0;
    });
  }
  create(e: Event) {
    e.preventDefault();
    this.error = ''; this.ok = '';
    const fd = new FormData(e.target as HTMLFormElement);
    const body = { name: fd.get('name'), email: fd.get('email'), password: fd.get('password'), role: fd.get('role') };
    this.http.post(`${environment.apiUrl}/admin/users`, body).subscribe(() => {
      this.ok = 'Đã tạo tài khoản nhân viên';
      (e.target as HTMLFormElement).reset();
      this.load();
    }, err => this.error = err.error?.message || 'Không tạo được');
  }
}
