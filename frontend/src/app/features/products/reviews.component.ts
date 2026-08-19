import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent implements OnInit {
  Math = Math;
  @Input() productId: string | null = null;
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

  constructor(private route: ActivatedRoute, private reviewsApi: ReviewService, public auth: AuthService) {}

  ngOnInit() {
    this.productId = this.productId || this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.loadReviews();
      this.checkCanReview();
    }
  }

  loadReviews() {
    if (!this.productId) return;
    this.isLoading = true;
    this.reviewsApi.listByProduct(this.productId).subscribe(
      (res: any) => {
        const data = res.data;
        this.reviews = Array.isArray(data) ? data : (data?.items || []);
        this.calculateRatings();
        this.isLoading = false;
      },
      () => { this.isLoading = false; }
    );
  }

  calculateRatings() {
    this.ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let total = 0;
    this.reviews.forEach((r) => {
      const rating = r.rating || 5;
      this.ratingCounts[rating] = (this.ratingCounts[rating] || 0) + 1;
      total += rating;
    });
    this.averageRating = this.reviews.length > 0 ? total / this.reviews.length : 0;
  }

  checkCanReview() {
    if (!this.productId || !this.auth.getToken()) {
      this.canReview = false;
      return;
    }
    this.reviewsApi.canReview(this.productId).subscribe(
      (res: any) => {
        this.canReview = res.data === true || res.data?.canReview === true;
      },
      () => { this.canReview = false; }
    );
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
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
    this.reviewsApi.create({
      product: this.productId as string,
      rating: this.formData.rating,
      body: this.formData.comment
    }).subscribe(
      () => {
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

  getStarArray(count: number): number[] {
    const n = Math.max(0, Math.floor(count || 0));
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  reviewerName(review: any): string {
    return review.user?.name || review.userId?.name || 'Ẩn danh';
  }

  reviewBody(review: any): string {
    return review.body || review.comment || review.title || '';
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 5000);
  }
}
