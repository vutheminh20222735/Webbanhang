import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  isSubmitted = false;

  constructor(private auth: AuthService) {}

  resetPassword() {
    if (!this.email) {
      this.showMessage('Vui lòng nhập email', 'error');
      return;
    }

    this.isLoading = true;
    this.auth.forgotPassword(this.email).subscribe(
      () => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.showMessage('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được ghi nhận.', 'success');
      },
      (err) => {
        this.isLoading = false;
        this.showMessage(err.error?.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
      }
    );
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
