import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {}

  resetPassword() {
    if (!this.email) {
      this.showMessage('Vui lòng nhập email', 'error');
      return;
    }

    this.isLoading = true;
    this.http
      .post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email })
      .subscribe(
        (res: any) => {
          this.isLoading = false;
          this.isSubmitted = true;
          this.showMessage('Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn.', 'success');
        },
        (err) => {
          this.isLoading = false;
          this.showMessage('Email không tồn tại hoặc có lỗi xảy ra', 'error');
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
