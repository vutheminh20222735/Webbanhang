import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  isEditing = false;
  isLoading = false;
  isSaving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  formData = {
    name: '',
    email: '',
    phone: '',
    address: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showPasswordForm = false;

  constructor(private auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading = true;
    const userFromToken = this.auth.getUserFromToken();
    if (userFromToken) {
      this.user = userFromToken;
      this.formData = {
        name: userFromToken.name || '',
        email: userFromToken.email || '',
        phone: userFromToken.phone || '',
        address: userFromToken.address || ''
      };
    }
    this.isLoading = false;
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.message = '';
  }

  saveProfile() {
    if (!this.formData.name || !this.formData.email) {
      this.showMessage('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    this.isSaving = true;
    this.http
      .put(`${environment.apiUrl}/auth/profile`, this.formData)
      .subscribe(
        (res: any) => {
          this.isSaving = false;
          this.showMessage('Cập nhật thông tin thành công', 'success');
          this.user = res.data || this.user;
          this.isEditing = false;
        },
        (err) => {
          this.isSaving = false;
          this.showMessage('Cập nhật thất bại: ' + (err.error?.message || err.message), 'error');
        }
      );
  }

  changePassword() {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showMessage('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showMessage('Mật khẩu mới không khớp', 'error');
      return;
    }

    if (newPassword.length < 6) {
      this.showMessage('Mật khẩu phải có ít nhất 6 ký tự', 'error');
      return;
    }

    this.isSaving = true;
    this.http
      .post(`${environment.apiUrl}/auth/change-password`, {
        currentPassword,
        newPassword
      })
      .subscribe(
        (res: any) => {
          this.isSaving = false;
          this.showMessage('Đổi mật khẩu thành công', 'success');
          this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
          this.showPasswordForm = false;
        },
        (err) => {
          this.isSaving = false;
          this.showMessage('Đổi mật khẩu thất bại: ' + (err.error?.message || err.message), 'error');
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
