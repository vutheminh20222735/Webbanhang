import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit {
  wishlistItems: any[] = [];
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadWishlist();
  }

  loadWishlist() {
    this.isLoading = true;
    this.http
      .get(`${environment.apiUrl}/wishlist`)
      .subscribe(
        (res: any) => {
          this.wishlistItems = res.data?.items || [];
          this.isLoading = false;
        },
        (err) => {
          console.error('Failed to load wishlist', err);
          this.isLoading = false;
        }
      );
  }

  removeFromWishlist(productId: string) {
    this.http
      .delete(`${environment.apiUrl}/wishlist/${productId}`)
      .subscribe(
        (res: any) => {
          this.showMessage('Xóa khỏi yêu thích thành công', 'success');
          this.loadWishlist();
        },
        (err) => {
          this.showMessage('Xóa thất bại', 'error');
        }
      );
  }

  clearWishlist() {
    if (!confirm('Bạn chắc chắn muốn xóa toàn bộ danh sách yêu thích?')) {
      return;
    }
    this.http
      .delete(`${environment.apiUrl}/wishlist`)
      .subscribe(
        (res: any) => {
          this.showMessage('Xóa toàn bộ yêu thích thành công', 'success');
          this.loadWishlist();
        },
        (err) => {
          this.showMessage('Xóa thất bại', 'error');
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
