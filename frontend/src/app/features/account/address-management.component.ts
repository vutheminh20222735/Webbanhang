import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Address {
  _id?: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  district: string;
  isDefault?: boolean;
}

@Component({
  templateUrl: './address-management.component.html',
  styleUrls: ['./address-management.component.scss']
})
export class AddressManagementComponent implements OnInit {
  addresses: Address[] = [];
  showForm = false;
  isEditing = false;
  isSaving = false;
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  formData: Address = {
    name: '',
    phone: '',
    line1: '',
    city: '',
    district: '',
    isDefault: false
  };

  editingId: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    this.isLoading = true;
    this.http
      .get(`${environment.apiUrl}/auth/addresses`)
      .subscribe(
        (res: any) => {
          this.addresses = res.data?.items || [];
          this.isLoading = false;
        },
        (err) => {
          console.error('Failed to load addresses', err);
          this.isLoading = false;
        }
      );
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  resetForm() {
    this.formData = {
      name: '',
      phone: '',
      line1: '',
      city: '',
      district: '',
      isDefault: false
    };
    this.isEditing = false;
    this.editingId = null;
  }

  editAddress(address: Address) {
    this.formData = { ...address };
    this.editingId = address._id || null;
    this.isEditing = true;
    this.showForm = true;
  }

  saveAddress() {
    if (!this.formData.name || !this.formData.phone || !this.formData.line1 || !this.formData.city) {
      this.showMessage('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    this.isSaving = true;

    if (this.isEditing && this.editingId) {
      this.http
        .put(`${environment.apiUrl}/auth/addresses/${this.editingId}`, this.formData)
        .subscribe(
          (res: any) => {
            this.isSaving = false;
            this.showMessage('Cập nhật địa chỉ thành công', 'success');
            this.loadAddresses();
            this.resetForm();
            this.showForm = false;
          },
          (err) => {
            this.isSaving = false;
            this.showMessage('Cập nhật thất bại: ' + (err.error?.message || err.message), 'error');
          }
        );
    } else {
      this.http
        .post(`${environment.apiUrl}/auth/addresses`, this.formData)
        .subscribe(
          (res: any) => {
            this.isSaving = false;
            this.showMessage('Thêm địa chỉ thành công', 'success');
            this.loadAddresses();
            this.resetForm();
            this.showForm = false;
          },
          (err) => {
            this.isSaving = false;
            this.showMessage('Thêm địa chỉ thất bại: ' + (err.error?.message || err.message), 'error');
          }
        );
    }
  }

  deleteAddress(address: Address) {
    if (!confirm('Bạn chắc chắn muốn xóa địa chỉ này?')) {
      return;
    }

    this.http
      .delete(`${environment.apiUrl}/auth/addresses/${address._id}`)
      .subscribe(
        (res: any) => {
          this.showMessage('Xóa địa chỉ thành công', 'success');
          this.loadAddresses();
        },
        (err) => {
          this.showMessage('Xóa địa chỉ thất bại: ' + (err.error?.message || err.message), 'error');
        }
      );
  }

  setDefault(address: Address) {
    this.http
      .post(`${environment.apiUrl}/auth/addresses/${address._id}/set-default`, {})
      .subscribe(
        (res: any) => {
          this.showMessage('Đặt làm địa chỉ mặc định thành công', 'success');
          this.loadAddresses();
        },
        (err) => {
          this.showMessage('Thất bại: ' + (err.error?.message || err.message), 'error');
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
