import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Coupon {
  _id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  maxUsage: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
}

@Component({
  templateUrl: './admin-coupons.component.html',
  styleUrls: ['./admin-coupons.component.scss']
})
export class AdminCouponsComponent implements OnInit {
  coupons: Coupon[] = [];
  showForm = false;
  isEditing = false;
  isSaving = false;
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  formData: Coupon = {
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscount: undefined,
    minOrderValue: 0,
    maxUsage: 999,
    usageCount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    isActive: true
  };

  editingId: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.isLoading = true;
    this.http
      .get(`${environment.apiUrl}/admin/coupons`)
      .subscribe(
        (res: any) => {
          this.coupons = res.data?.items || [];
          this.isLoading = false;
        },
        (err) => {
          console.error('Failed to load coupons', err);
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
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      maxDiscount: undefined,
      minOrderValue: 0,
      maxUsage: 999,
      usageCount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: '',
      isActive: true
    };
    this.isEditing = false;
    this.editingId = null;
  }

  editCoupon(coupon: Coupon) {
    this.formData = { ...coupon };
    this.editingId = coupon._id || null;
    this.isEditing = true;
    this.showForm = true;
  }

  saveCoupon() {
    if (!this.formData.code || this.formData.discountValue <= 0) {
      this.showMessage('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    this.isSaving = true;

    if (this.isEditing && this.editingId) {
      this.http
        .put(`${environment.apiUrl}/admin/coupons/${this.editingId}`, this.formData)
        .subscribe(
          (res: any) => {
            this.isSaving = false;
            this.showMessage('Cập nhật mã giảm giá thành công', 'success');
            this.loadCoupons();
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
        .post(`${environment.apiUrl}/admin/coupons`, this.formData)
        .subscribe(
          (res: any) => {
            this.isSaving = false;
            this.showMessage('Tạo mã giảm giá thành công', 'success');
            this.loadCoupons();
            this.resetForm();
            this.showForm = false;
          },
          (err) => {
            this.isSaving = false;
            this.showMessage('Tạo thất bại: ' + (err.error?.message || err.message), 'error');
          }
        );
    }
  }

  deleteCoupon(coupon: Coupon) {
    if (!confirm('Bạn chắc chắn muốn xóa mã này?')) {
      return;
    }

    this.http
      .delete(`${environment.apiUrl}/admin/coupons/${coupon._id}`)
      .subscribe(
        (res: any) => {
          this.showMessage('Xóa mã giảm giá thành công', 'success');
          this.loadCoupons();
        },
        (err) => {
          this.showMessage('Xóa thất bại: ' + (err.error?.message || err.message), 'error');
        }
      );
  }

  toggleActive(coupon: Coupon) {
    coupon.isActive = !coupon.isActive;
    this.http
      .patch(`${environment.apiUrl}/admin/coupons/${coupon._id}`, { isActive: coupon.isActive })
      .subscribe(
        () => {
          this.showMessage(coupon.isActive ? 'Kích hoạt thành công' : 'Vô hiệu hóa thành công', 'success');
        },
        (err) => {
          coupon.isActive = !coupon.isActive;
          this.showMessage('Thất bại', 'error');
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

  getDiscountDisplay(coupon: Coupon): string {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    }
    return `${coupon.discountValue.toLocaleString('vi-VN')}₫`;
  }

  isExpired(coupon: Coupon): boolean {
    return new Date(coupon.endDate) < new Date();
  }

  getRemainingUsage(coupon: Coupon): number {
    return coupon.maxUsage - coupon.usageCount;
  }
}
