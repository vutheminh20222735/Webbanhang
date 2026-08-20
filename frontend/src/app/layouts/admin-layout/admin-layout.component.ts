import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopChatService } from '../../core/services/shop-chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="admin-shell">
      <aside class="admin-side">
        <div class="admin-side-head">
          <a routerLink="/" class="logo">Phone<span>Shop</span></a>
          <button class="menu-toggle" type="button" (click)="menuOpen = !menuOpen">☰</button>
        </div>
        <nav class="admin-links" [class.open]="menuOpen">
          <p class="side-label">{{roleLabel}}</p>
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Tổng quan</a>
          <a routerLink="/admin/products" routerLinkActive="active" (click)="closeMenu()">Sản phẩm</a>
          <a routerLink="/admin/orders" routerLinkActive="active" (click)="closeMenu()">Đơn hàng</a>
          <a *ngIf="isAdmin" routerLink="/admin/coupons" routerLinkActive="active" (click)="closeMenu()">
  Mã giảm giá
</a>
          <a *ngIf="isAdmin" routerLink="/admin/users" routerLinkActive="active" (click)="closeMenu()">Nhân viên</a>
          <a *ngIf="canAi" routerLink="/admin/ai" routerLinkActive="active" (click)="closeMenu()">Trợ lý AI</a>
          <a routerLink="/admin/chat" routerLinkActive="active" (click)="closeMenu()" style="display:flex;align-items:center;justify-content:space-between">
            Tin nhắn
            <span *ngIf="chatUnread > 0" style="background:#ef4444;color:#fff;font-size:11px;font-weight:700;border-radius:999px;padding:1px 8px;min-width:20px;text-align:center">{{chatUnread}}</span>
          </a>
          <a routerLink="/" class="side-store" (click)="closeMenu()">← Về cửa hàng</a>
          <button class="btn-ghost" (click)="logout()">Đăng xuất</button>
        </nav>
      </aside>
      <section class="admin-content">
        <header class="admin-top">
          <h1>{{title}}</h1>
          <span class="badge">{{role}}</span>
        </header>
        <router-outlet></router-outlet>
      </section>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  menuOpen = false;
  chatUnread = 0;
  private sub = new Subscription();

  constructor(public auth: AuthService, private router: Router, private chatSvc: ShopChatService) {}

  ngOnInit() {
    // Tải badge ban đầu
    this.chatSvc.getStaffUnreadCount().subscribe({ next: (r) => { this.chatUnread = r.data?.count || 0; } });

    // Realtime: lắng nghe cập nhật
    this.chatSvc.joinStaffRoom();
    this.sub.add(
      this.chatSvc.staffUnread$.subscribe((n) => { this.chatUnread = n; })
    );
    this.sub.add(
      this.chatSvc.conversationUpdated$.subscribe(() => {
        // Refresh unread count từ server để chính xác
        this.chatSvc.getStaffUnreadCount().subscribe({ next: (r) => { this.chatUnread = r.data?.count || 0; } });
      })
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  get role() { return this.auth.getUserFromToken()?.role || ''; }
  get isAdmin() { return this.auth.hasRole('ADMIN'); }
  get canAi() { return this.auth.hasRole('ADMIN', 'MANAGER'); }
  get roleLabel() {
    if (this.role === 'ADMIN') return 'Quản trị viên';
    if (this.role === 'MANAGER') return 'Quản lý';
    return 'Nhân viên';
  }
  get title() { return 'Bảng điều khiển'; }
  closeMenu() { this.menuOpen = false; }
  logout() { this.auth.logout(); this.router.navigate(['/']); }
}
