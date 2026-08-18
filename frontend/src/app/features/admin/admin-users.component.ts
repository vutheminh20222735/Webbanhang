import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
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
