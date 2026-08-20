import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener
} from '@angular/core';
import { ShopChatService, ChatConversation, ChatMessage, ShopContact } from '../../services/shop-chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

type View = 'menu' | 'chat';

@Component({
  selector: 'app-shop-chat',
  templateUrl: './shop-chat.component.html',
  styleUrls: ['./shop-chat.component.scss']
})
export class ShopChatComponent implements OnInit, OnDestroy {
  open = false;
  view: View = 'menu';

  contact: ShopContact | null = null;
  conversation: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  inputText = '';
  sending = false;
  loading = false;
  error = '';

  @ViewChild('msgWrap') msgWrap?: ElementRef<HTMLDivElement>;

  private sub = new Subscription();

  constructor(public chatSvc: ShopChatService, public auth: AuthService) {}

  ngOnInit() {
    this.chatSvc.getContact().subscribe((r) => { this.contact = r.data; });

    // Lắng nghe tin nhắn mới từ socket
    this.sub.add(
      this.chatSvc.newMessage$.subscribe((evt) => {
        if (this.conversation && evt.conversationId === this.conversation._id) {
          // Tránh duplicate nếu tin do mình gửi qua HTTP đã được thêm
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
    if (this.conversation) this.chatSvc.leaveConversation(this.conversation._id);
  }

  toggleOpen() {
    this.open = !this.open;
    if (this.open) this.view = 'menu';
  }

  openChat() {
    this.view = 'chat';
    if (!this.conversation) this.loadOrCreateConversation();
  }

  openZalo() {
    if (this.contact?.zalo) window.open(this.contact.zalo, '_blank');
  }

  openFacebook() {
    if (this.contact?.facebook) window.open(this.contact.facebook, '_blank');
  }

  showPhone() {
    this.view = 'menu'; // stays open to show phone
  }

  backToMenu() { this.view = 'menu'; }

  close() { this.open = false; }

  @HostListener('document:keydown.escape')
  onEsc() { this.close(); }

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
        // Replace optimistic with real message from server
        this.messages = [...this.messages.slice(0, -1), r.data];
        this.sending = false;
        this.scrollBottom();
      },
      error: () => {
        this.messages = this.messages.slice(0, -1); // Remove optimistic
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
