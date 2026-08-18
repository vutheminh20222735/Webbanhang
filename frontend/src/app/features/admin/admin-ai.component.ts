import { Component } from '@angular/core';
import { AiService } from '../../core/services/ai.service';

@Component({
  template: `
    <div class="admin-card ai-box">
      <h3>Trợ lý AI quản trị</h3>
      <p class="muted">Hỏi doanh thu, đơn hôm nay, sản phẩm bán chạy, hàng sắp hết...</p>
      <div class="messages admin-messages">
        <div *ngFor="let m of messages" [class.user]="m.role==='user'" [class.bot]="m.role!=='user'">{{m.text}}</div>
      </div>
      <form class="ai-form" (submit)="send($event)">
        <input name="q" placeholder="Ví dụ: Doanh thu tháng này?" />
        <button class="btn-primary" type="submit">Gửi</button>
      </form>
    </div>
  `
})
export class AdminAiComponent {
  messages: any[] = [{ role: 'assistant', text: 'Xin chào, tôi có thể giúp báo cáo cửa hàng.' }];
  constructor(private ai: AiService) {}
  send(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const q = (form.querySelector('input[name=q]') as HTMLInputElement).value;
    if (!q) return;
    this.messages.push({ role: 'user', text: q });
    this.ai.adminChat(q).subscribe((res: any) => {
      this.messages.push({ role: 'assistant', text: res.data?.reply || JSON.stringify(res.data) });
    }, () => this.messages.push({ role: 'assistant', text: 'Không gọi được AI. Kiểm tra AI_API_KEY trên Render.' }));
    (form.querySelector('input') as HTMLInputElement).value = '';
  }
}
