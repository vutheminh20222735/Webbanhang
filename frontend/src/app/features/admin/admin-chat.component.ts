import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ShopChatService, ChatConversation, ChatMessage } from '../../core/services/shop-chat.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './admin-chat.component.html',
  styleUrls: ['./admin-chat.component.scss']
})
export class AdminChatComponent implements OnInit, OnDestroy {
  conversations: ChatConversation[] = [];
  activeConv: ChatConversation | null = null;
  messages: ChatMessage[] = [];
  replyText = '';
  sending = false;
  loadingConvs = true;
  loadingMsgs = false;
  statusFilter: 'open' | 'closed' | 'all' = 'open';

  @ViewChild('msgWrap') msgWrap?: ElementRef<HTMLDivElement>;

  private sub = new Subscription();

  constructor(private chatSvc: ShopChatService, public auth: AuthService) {}

  ngOnInit() {
    this.chatSvc.joinStaffRoom();
    this.loadConversations();

    // Realtime: khi có conversation mới / cập nhật
    this.sub.add(
      this.chatSvc.conversationUpdated$.subscribe((evt: any) => {
        const idx = this.conversations.findIndex((c) => c._id === evt.conversationId);
        if (idx !== -1) {
          this.conversations[idx] = {
            ...this.conversations[idx],
            lastMessage: evt.lastMessage,
            lastMessageAt: evt.lastMessageAt,
            unreadStaff: evt.unreadStaff
          };
          // Đưa lên đầu
          const updated = this.conversations.splice(idx, 1)[0];
          this.conversations = [updated, ...this.conversations];
        } else {
          // Conversation mới, reload list
          this.loadConversations(false);
        }
      })
    );

    // Realtime: tin nhắn mới trong conversation đang xem
    this.sub.add(
      this.chatSvc.newMessage$.subscribe((evt) => {
        if (this.activeConv && evt.conversationId === this.activeConv._id) {
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
    if (this.activeConv) this.chatSvc.leaveConversation(this.activeConv._id);
  }

  loadConversations(showLoading = true) {
    if (showLoading) this.loadingConvs = true;
    this.chatSvc.listConversations(this.statusFilter).subscribe({
      next: (r) => {
        this.conversations = r.data;
        this.loadingConvs = false;
      },
      error: () => { this.loadingConvs = false; }
    });
  }

  selectConversation(conv: ChatConversation) {
    if (this.activeConv?._id === conv._id) return;

    if (this.activeConv) this.chatSvc.leaveConversation(this.activeConv._id);

    this.activeConv = conv;
    this.messages = [];
    this.loadingMsgs = true;
    this.chatSvc.markRead(conv._id).subscribe();

    this.chatSvc.getAdminConversation(conv._id).subscribe({
      next: (r) => {
        this.messages = r.data.messages || [];
        this.activeConv = r.data;
        this.loadingMsgs = false;
        this.chatSvc.joinConversation(conv._id);
        this.scrollBottom();
        // Reset unread badge on this conversation
        const idx = this.conversations.findIndex((c) => c._id === conv._id);
        if (idx !== -1) this.conversations[idx] = { ...this.conversations[idx], unreadStaff: 0 };
      },
      error: () => { this.loadingMsgs = false; }
    });
  }

  reply() {
    const text = this.replyText.trim();
    if (!text || !this.activeConv || this.sending) return;

    const optimistic: ChatMessage = { sender: 'staff', text, createdAt: new Date().toISOString() };
    this.messages = [...this.messages, optimistic];
    this.replyText = '';
    this.sending = true;
    this.scrollBottom();

    this.chatSvc.sendStaffMessage(this.activeConv._id, text).subscribe({
      next: (r) => {
        this.messages = [...this.messages.slice(0, -1), r.data];
        this.sending = false;
        this.scrollBottom();
        // Update conversation list preview
        const idx = this.conversations.findIndex((c) => c._id === this.activeConv!._id);
        if (idx !== -1) {
          this.conversations[idx] = { ...this.conversations[idx], lastMessage: text, lastMessageAt: new Date().toISOString() };
        }
      },
      error: () => {
        this.messages = this.messages.slice(0, -1);
        this.sending = false;
      }
    });
  }

  closeConversation() {
    if (!this.activeConv) return;
    this.chatSvc.updateStatus(this.activeConv._id, 'closed').subscribe(() => {
      this.activeConv = null;
      this.messages = [];
      this.loadConversations();
    });
  }

  onReplyKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.reply(); }
  }

  changeFilter(f: 'open' | 'closed' | 'all') {
    this.statusFilter = f;
    this.activeConv = null;
    this.messages = [];
    this.loadConversations();
  }

  getDisplayName(conv: ChatConversation): string {
    if (conv.user) return (conv.user as any).name || (conv.user as any).email || 'Khách';
    return conv.guestName || 'Khách vãng lai';
  }

  getInitial(conv: ChatConversation): string {
    return (this.getDisplayName(conv) || 'K').charAt(0).toUpperCase();
  }

  private scrollBottom() {
    requestAnimationFrame(() => {
      const el = this.msgWrap?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
