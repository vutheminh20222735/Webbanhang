import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent implements OnInit {
  Math = Math;
  
  productId: string | null = null;
  reviews: any[] = [];
  averageRating = 0;
  ratingCounts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  isLoading = false;
  isSubmitting = false;
  showForm = false;
  canReview = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  formData = {
    rating: 5,
    comment: ''
  };

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.loadReviews();
      this.checkCanReview();
    }
  }

  loadReviews() {
    if (!this.productId) return;
    this.isLoading = true;
    this.http
      .get(`${environment.apiUrl}/reviews/product/${this.productId}`)
      .subscribe(
        (res: any) => {
          this.reviews = res.data?.items || [];
          this.calculateRatings();
          this.isLoading = false;
        },
        (err) => {
          console.error('Failed to load reviews', err);
          this.isLoading = false;
        }
      );
  }

  calculateRatings() {
    this.ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let total = 0;

    this.reviews.forEach((r) => {
      const rating = r.rating || 5;
      this.ratingCounts[rating]++;
      total += rating;
    });

    this.averageRating = this.reviews.length > 0 ? total / this.reviews.length : 0;
  }

  checkCanReview() {
    if (!this.productId) return;
    this.http
      .get(`${environment.apiUrl}/reviews/can-review/${this.productId}`)
      .subscribe(
        (res: any) => {
          this.canReview = res.data?.canReview || false;
        },
        (err) => {
          this.canReview = false;
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
    this.formData = { rating: 5, comment: '' };
  }

  submitReview() {
    if (!this.formData.comment.trim()) {
      this.showMessage('Vui lòng nhập bình luận', 'error');
      return;
    }

    if (this.formData.comment.length < 10) {
      this.showMessage('Bình luận phải ít nhất 10 ký tự', 'error');
      return;
    }

    this.isSubmitting = true;
    this.http
      .post(`${environment.apiUrl}/reviews`, {
        productId: this.productId,
        rating: this.formData.rating,
        comment: this.formData.comment
      })
      .subscribe(
        (res: any) => {
          this.isSubmitting = false;
          this.showMessage('Đánh giá được gửi thành công!', 'success');
          this.loadReviews();
          this.showForm = false;
          this.resetForm();
        },
        (err) => {
          this.isSubmitting = false;
          this.showMessage('Gửi đánh giá thất bại: ' + (err.error?.message || err.message), 'error');
        }
      );
  }

  getRatingPercentage(rating: number): number {
    if (this.reviews.length === 0) return 0;
    return (this.ratingCounts[rating] / this.reviews.length) * 100;
  }

  getStarArray(rating: number): number[] {
    return Array(5)
      .fill(0)
      .map((_, i) => i + 1);
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
