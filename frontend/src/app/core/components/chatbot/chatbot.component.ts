import { Component } from '@angular/core';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-chatbot',
  template: `
    <div class="chatbot-floating" (click)="toggle()">
      <div *ngIf="!open">💬</div>
    </div>
    <div class="chatbot-panel" *ngIf="open">
      <div class="chat-header">AI Assistant <button (click)="close()">✖</button></div>
      <div class="messages">
        <div *ngFor="let m of messages" [class.user]="m.role==='user'">{{m.text}}</div>
      </div>
      <form (submit)="send($event)">
        <input name="text" placeholder="Hỏi tôi về điện thoại..." />
      </form>
    </div>
  `,
  styles: [`.chatbot-floating{position:fixed;right:20px;bottom:20px;background:#1976d2;color:#fff;border-radius:50%;width:56px;height:56px;display:flex;align-items:center;justify-content:center;cursor:pointer}`,
  `.chatbot-panel{position:fixed;right:20px;bottom:90px;width:320px;height:480px;background:#fff;border:1px solid #ddd;border-radius:8px;display:flex;flex-direction:column}`,
  `.chat-header{padding:8px 12px;background:#1976d2;color:#fff;display:flex;justify-content:space-between}`,
  `.messages{padding:12px;flex:1;overflow:auto}`,
  `.messages .user{text-align:right;color:#1976d2}`]
})
export class ChatbotComponent {
  open = false;
  messages: any[] = [];
  constructor(private ai: AiService) {}
  toggle() { this.open = !this.open; }
  close() { this.open = false; }
  send(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const text = fd.get('text') as string;
    if (!text) return;
    this.messages.push({ role: 'user', text });
    this.ai.chat(text).subscribe((res: any) => {
      const data = res.data;
      if (data.reply) this.messages.push({ role: 'assistant', text: data.reply });
      else if (data.tool) this.messages.push({ role: 'assistant', text: JSON.stringify(data.result || data) });
    }, err => this.messages.push({ role: 'assistant', text: 'Lỗi khi gọi AI' }));
    (form.querySelector('input') as HTMLInputElement).value = '';
  }
}
