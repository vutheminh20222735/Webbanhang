import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit {
  wishlistItems: any[] = [];
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private wishlist: WishlistService) {}

  ngOnInit() {
    this.isLoading = true;
    this.wishlist.items$.subscribe((items) => {
      this.wishlistItems = items;
      this.isLoading = false;
    });
    this.wishlist.reload();
  }

  removeFromWishlist(productId: string) {
    this.wishlist.remove(productId).subscribe({
      next: () => this.showMessage('Xóa khỏi yêu thích thành công', 'success'),
      error: () => this.showMessage('Xóa thất bại', 'error')
    });
  }

  clearWishlist() {
    if (!confirm('Bạn chắc chắn muốn xóa toàn bộ danh sách yêu thích?')) return;
    this.wishlist.clear().subscribe({
      next: () => this.showMessage('Xóa toàn bộ yêu thích thành công', 'success'),
      error: () => this.showMessage('Xóa thất bại', 'error')
    });
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 5000);
  }
}
