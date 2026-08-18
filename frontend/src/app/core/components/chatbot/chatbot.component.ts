import { Component } from '@angular/core';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-chatbot',
  template: `
    <button class="chatbot-floating" type="button" (click)="toggle()">💬</button>
    <div class="chatbot-panel" *ngIf="open">
      <div class="chat-header">Tư vấn điện thoại <button type="button" (click)="close()">✖</button></div>
      <div class="messages">
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
  constructor(private ai: AiService) {}
  toggle() { this.open = !this.open; }
  close() { this.open = false; }
  send(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const text = (new FormData(form).get('text') as string || '').trim();
    if (!text) return;
    this.messages.push({ role: 'user', text });
    this.ai.chat(text).subscribe((res: any) => {
      this.messages.push({ role: 'assistant', text: res.data?.reply || 'Không có phản hồi' });
    }, () => this.messages.push({ role: 'assistant', text: 'Không kết nối được trợ lý AI.' }));
    (form.querySelector('input') as HTMLInputElement).value = '';
  }
}
