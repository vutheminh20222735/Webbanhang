import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
  _id?: string;
  sender: 'customer' | 'staff';
  text: string;
  createdAt?: string;
}

export interface ChatConversation {
  _id: string;
  user?: { _id: string; name: string; email: string } | null;
  guestId?: string;
  guestName?: string;
  status: 'open' | 'closed';
  unreadStaff: number;
  unreadCustomer: number;
  messages: ChatMessage[];
  lastMessage: string;
  lastMessageAt: string;
}

export interface ShopContact {
  phone: string;
  phoneHref: string;
  zalo: string;
  facebook: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ShopChatService {
  private api = environment.apiUrl;

  /** Conversation đang active của KH */
  conversation$ = new BehaviorSubject<ChatConversation | null>(null);
  /** Tin nhắn mới đến qua socket */
  newMessage$ = new Subject<{ conversationId: string; message: ChatMessage }>();
  /** Badge unread cho staff */
  staffUnread$ = new BehaviorSubject<number>(0);
  /** Thông báo conversation mới/updated cho staff */
  conversationUpdated$ = new Subject<any>();

  private socket: Socket | null = null;
  private guestId: string = '';
  private socketListenersReady = false;

  constructor(private http: HttpClient, private auth: AuthService) {
    this.guestId = this.getOrCreateGuestId();
  }

  getOrCreateGuestId(): string {
    let id = localStorage.getItem('phs_guest_chat_id');
    if (!id) {
      id = 'guest_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('phs_guest_chat_id', id);
    }
    return id;
  }

  getContact() {
    return this.http.get<{ success: boolean; data: ShopContact }>(`${this.api}/chat/contact`);
  }

  getOrCreateConversation() {
    const user = this.auth.getUserFromToken();
    const body = user ? {} : { guestId: this.guestId, guestName: 'Khách hàng' };
    return this.http.post<{ success: boolean; data: ChatConversation }>(`${this.api}/chat/conversations`, body);
  }

  getConversation(id: string) {
    const user = this.auth.getUserFromToken();
    const params = user ? {} : { guestId: this.guestId };
    return this.http.get<{ success: boolean; data: ChatConversation }>(`${this.api}/chat/conversations/${id}`, { params });
  }

  sendMessage(conversationId: string, text: string) {
    const user = this.auth.getUserFromToken();
    const body: any = { text };
    if (!user) body.guestId = this.guestId;
    return this.http.post<{ success: boolean; data: ChatMessage }>(
      `${this.api}/chat/conversations/${conversationId}/messages`, body
    );
  }

  // ---- Admin APIs ----
  listConversations(status = 'open', page = 1) {
    return this.http.get<{ success: boolean; data: ChatConversation[]; total: number }>(
      `${this.api}/chat/admin/conversations`, { params: { status, page: String(page), limit: '30' } }
    );
  }

  getAdminConversation(id: string) {
    return this.http.get<{ success: boolean; data: ChatConversation }>(`${this.api}/chat/conversations/${id}`);
  }

  sendStaffMessage(conversationId: string, text: string) {
    return this.http.post<{ success: boolean; data: ChatMessage }>(
      `${this.api}/chat/conversations/${conversationId}/messages`, { text }
    );
  }

  updateStatus(id: string, status: 'open' | 'closed') {
    return this.http.patch<{ success: boolean; data: ChatConversation }>(
      `${this.api}/chat/admin/conversations/${id}/status`, { status }
    );
  }

  markRead(id: string) {
    return this.http.patch<{ success: boolean }>(`${this.api}/chat/admin/conversations/${id}/read`, {});
  }

  getStaffUnreadCount() {
    return this.http.get<{ success: boolean; data: { count: number } }>(`${this.api}/chat/admin/unread-count`);
  }

  // ---- Socket.IO ----
  private getSocketBaseUrl(): string {
    const wsUrl = (environment as { wsUrl?: string }).wsUrl;
    if (wsUrl) return wsUrl;
    // apiUrl dạng https://host/api → socket cần https://host
    return environment.apiUrl.replace(/\/api\/?$/, '') || window.location.origin;
  }

  initSocket() {
    if (this.socket) return;
    this.socket = io(this.getSocketBaseUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    if (!this.socketListenersReady) {
      this.socket.on('new_message', (data: { conversationId: string; message: ChatMessage }) => {
        this.newMessage$.next(data);
      });
      this.socket.on('conversation_updated', (data: any) => {
        this.conversationUpdated$.next(data);
        this.staffUnread$.next((this.staffUnread$.value || 0) + 1);
      });
      this.socketListenersReady = true;
    }
  }

  joinConversation(conversationId: string) {
    if (!this.socket) this.initSocket();
    this.socket?.emit('join_conversation', conversationId);
  }

  joinStaffRoom() {
    if (!this.socket) this.initSocket();
    const token = this.auth.getToken();
    this.socket?.emit('join_staff', token);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave_conversation', conversationId);
  }

  disconnectSocket() {
    this.socket?.disconnect();
    this.socket = null;
    this.socketListenersReady = false;
  }
}
