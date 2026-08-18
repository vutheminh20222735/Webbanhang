import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  template: `
    <div class="auth-card">
      <h1>Đăng nhập</h1>
      <p class="muted">Dùng tài khoản demo: admin@demo.com / Password123</p>
      <form (submit)="onSubmit($event)">
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Mật khẩu" required />
        <p class="error" *ngIf="error">{{error}}</p>
        <button class="btn-primary" type="submit">Đăng nhập</button>
      </form>
    </div>
  `
})
export class LoginComponent {
  error = '';
  constructor(private auth: AuthService, private router: Router) {}
  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    this.auth.login(email, password).subscribe((res: any) => {
      const token = res.data?.token;
      if (token) {
        this.auth.setToken(token);
        const user = this.auth.getUserFromToken();
        this.router.navigate(user && ['ADMIN','MANAGER','STAFF'].includes(user.role) ? ['/admin'] : ['/']);
      }
    }, () => this.error = 'Email hoặc mật khẩu không đúng');
  }
}
