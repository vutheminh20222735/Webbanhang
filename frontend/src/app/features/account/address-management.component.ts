import { Component, OnInit } from '@angular/core';
import { AddressService, SavedAddress } from '../../core/services/address.service';

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

  constructor(private addressesApi: AddressService) {}

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    this.isLoading = true;
    this.addressesApi.load().subscribe(
      (items) => {
        this.addresses = items;
        this.isLoading = false;
      },
      () => { this.isLoading = false; }
    );
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  resetForm() {
    this.formData = { name: '', phone: '', line1: '', city: '', district: '', isDefault: false };
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
    this.addressesApi.save({
      ...(this.formData as SavedAddress),
      _id: this.editingId || this.formData._id
    }).subscribe(
      () => {
        this.isSaving = false;
        this.showMessage(this.isEditing ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công', 'success');
        this.loadAddresses();
        this.resetForm();
        this.showForm = false;
      },
      (err) => {
        this.isSaving = false;
        this.showMessage('Thất bại: ' + (err.error?.message || err.message), 'error');
      }
    );
  }

  deleteAddress(address: Address) {
    if (!confirm('Bạn chắc chắn muốn xóa địa chỉ này?')) return;
    if (!address._id) return;
    this.addressesApi.remove(address._id).subscribe(
      () => {
        this.showMessage('Xóa địa chỉ thành công', 'success');
        this.loadAddresses();
      },
      (err) => this.showMessage('Xóa thất bại: ' + (err.error?.message || err.message), 'error')
    );
  }

  setDefault(address: Address) {
    if (!address._id) return;
    this.addressesApi.setDefault(address._id).subscribe(
      () => {
        this.showMessage('Đặt làm địa chỉ mặc định thành công', 'success');
        this.loadAddresses();
      },
      (err) => this.showMessage('Thất bại: ' + (err.error?.message || err.message), 'error')
    );
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 5000);
  }
}
