import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener
} from '@angular/core';
import { ShopChatService, ChatConversation, ChatMessage, ShopContact } from '../../services/shop-chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shop-chat',
  templateUrl: './shop-chat.component.html',
  styleUrls: ['./shop-chat.component.scss']
})
export class ShopChatComponent implements OnInit, OnDestroy {
  /** Speed-dial 4 icon mở phía trên FAB */
  menuOpen = false;
  /** Cửa sổ chat */
  chatOpen = false;
  phoneTipVisible = false;

  contact: ShopContact | null = null;
  conversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  inputText = '';
  sending = false;
  loading = false;
  error = '';

  @ViewChild('msgWrap') msgWrap?: ElementRef<HTMLDivElement>;

  private sub = new Subscription();
  private phoneTimer: any;

  constructor(public chatSvc: ShopChatService, public auth: AuthService) {}

  ngOnInit() {
    this.chatSvc.getContact().subscribe({
      next: (r) => { this.contact = r.data; },
      error: () => { /* vẫn dùng fallback trong template */ }
    });

    this.sub.add(
      this.chatSvc.newMessage$.subscribe((evt) => {
        if (this.conversation && String(evt.conversationId) === String(this.conversation._id)) {
          const exists = this.messages.some((m: any) => m._id && m._id === (evt.message as any)._id);
          if (!exists) {
            this.messages = [...this.messages, evt.message];
            this.scrollBottom();
          }
        }
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    if (this.phoneTimer) clearTimeout(this.phoneTimer);
    if (this.conversation) this.chatSvc.leaveConversation(this.conversation._id);
  }

  toggleOpen() {
    if (this.chatOpen) {
      this.close();
      return;
    }
    this.menuOpen = !this.menuOpen;
    this.phoneTipVisible = false;
  }

  openChat() {
    this.menuOpen = false;
    this.chatOpen = true;
    this.phoneTipVisible = false;
    if (!this.conversation) this.loadOrCreateConversation();
    else {
      this.chatSvc.joinConversation(this.conversation._id);
      this.scrollBottom();
    }
  }

  onPhone() {
    this.phoneTipVisible = true;
    if (this.phoneTimer) clearTimeout(this.phoneTimer);
    this.phoneTimer = setTimeout(() => { this.phoneTipVisible = false; }, 6000);
    const href = this.contact?.phoneHref || 'tel:19000000';
    // Mobile: mở dialer; desktop vẫn hiện tip
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      window.location.href = href;
    }
  }

  backToMenu() {
    this.chatOpen = false;
    this.menuOpen = true;
  }

  close() {
    this.menuOpen = false;
    this.chatOpen = false;
    this.phoneTipVisible = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.menuOpen || this.chatOpen || this.phoneTipVisible) this.close();
  }

  loadOrCreateConversation() {
    this.loading = true;
    this.error = '';
    this.chatSvc.getOrCreateConversation().subscribe({
      next: (r) => {
        this.conversation = r.data;
        this.messages = r.data.messages || [];
        this.loading = false;
        this.chatSvc.joinConversation(r.data._id);
        this.scrollBottom();
      },
      error: () => {
        this.error = 'Không thể kết nối. Vui lòng thử lại.';
        this.loading = false;
      }
    });
  }

  send() {
    const text = this.inputText.trim();
    if (!text || !this.conversation || this.sending) return;

    const optimistic: ChatMessage = { sender: 'customer', text, createdAt: new Date().toISOString() };
    this.messages = [...this.messages, optimistic];
    this.inputText = '';
    this.sending = true;
    this.scrollBottom();

    this.chatSvc.sendMessage(this.conversation._id, text).subscribe({
      next: (r) => {
        this.messages = [...this.messages.slice(0, -1), r.data];
        this.sending = false;
        this.scrollBottom();
      },
      error: () => {
        this.messages = this.messages.slice(0, -1);
        this.error = 'Gửi thất bại, thử lại.';
        this.sending = false;
      }
    });
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  private scrollBottom() {
    requestAnimationFrame(() => {
      const el = this.msgWrap?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
