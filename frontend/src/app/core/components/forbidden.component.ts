import { Component } from '@angular/core';

@Component({
  template: `
    <div class="auth-card">
      <h2>Không có quyền truy cập</h2>
      <p class="muted">Tài khoản của bạn không được vào khu vực này.</p>
      <a routerLink="/" class="btn-primary">Về cửa hàng</a>
    </div>
  `
})
export class ForbiddenComponent {}
