import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  template: `
    <div class="auth-card">
      <h1>Đăng ký khách hàng</h1>
      <p class="muted">Chỉ dành cho khách mua hàng. Nhân viên được admin cấp tài khoản.</p>
      <form (submit)="onSubmit($event)">
        <input name="name" placeholder="Họ và tên" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Mật khẩu (tối thiểu 6 ký tự)" required minlength="6" />
        <p class="error" *ngIf="error">{{error}}</p>
        <button class="btn-primary" type="submit">Tạo tài khoản</button>
      </form>
      <p class="muted">Đã có tài khoản? <a routerLink="/login">Đăng nhập</a></p>
    </div>
  `
})
export class RegisterComponent {
  error = '';
  constructor(private auth: AuthService, private router: Router) {}
  onSubmit(e: Event) {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      password: fd.get('password'),
      role: 'CUSTOMER'
    };
    this.auth.register(payload).subscribe((res: any) => {
      const token = res.data?.token;
      if (token) { this.auth.setToken(token); this.router.navigate(['/']); }
    }, err => this.error = err.error?.message || 'Không đăng ký được');
  }
}
