import { Component, ElementRef, ViewChild } from '@angular/core';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-chatbot',
  template: `
    <button class="chatbot-floating" type="button" (click)="toggle()">💬</button>
    <div class="chatbot-panel" *ngIf="open">
      <div class="chat-header">Tư vấn điện thoại <button type="button" (click)="close()">✖</button></div>
      <div class="messages" #messagesWrap>
        <div *ngFor="let m of messages" [class.user]="m.role==='user'" [class.bot]="m.role!=='user'">{{m.text}}</div>
      </div>
      <form (submit)="send($event)">
        <input name="text" placeholder="Hỏi máy phù hợp ngân sách..." />
      </form>
    </div>
  `
})
export class ChatbotComponent {
  open = false;
  messages: any[] = [{ role: 'assistant', text: 'Xin chào! Bạn đang tìm điện thoại khoảng bao nhiêu tiền?' }];
  sending = false;
  @ViewChild('messagesWrap') messagesWrap?: ElementRef<HTMLDivElement>;
  constructor(private ai: AiService) {}
  toggle() { this.open = !this.open; }
  close() { this.open = false; }
  private scrollToBottom() {
    requestAnimationFrame(() => {
      const el = this.messagesWrap?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }
  send(e: Event) {
    e.preventDefault();
    if (this.sending) return;
    const form = e.target as HTMLFormElement;
    const text = (new FormData(form).get('text') as string || '').trim();
    if (!text) return;
    this.messages.push({ role: 'user', text });
    this.scrollToBottom();
    this.sending = true;
    const history = this.messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text }));

    this.ai.chat(text, history).subscribe((res: any) => {
      this.messages.push({ role: 'assistant', text: res.data?.reply || 'Không có phản hồi' });
      this.sending = false;
      this.scrollToBottom();
    }, () => {
      this.messages.push({ role: 'assistant', text: 'Không kết nối được trợ lý AI. Vui lòng thử lại.' });
      this.sending = false;
      this.scrollToBottom();
    });
    (form.querySelector('input') as HTMLInputElement).value = '';
  }
}
