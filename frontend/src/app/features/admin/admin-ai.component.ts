import { Component } from '@angular/core';
import { AiService } from '../../core/services/ai.service';

@Component({
  templateUrl: './admin-ai.component.html',
  styleUrls: ['./admin-ai.component.scss']
})
export class AdminAiComponent {
  messages: any[] = [{ role: 'assistant', text: 'Xin chào, tôi có thể giúp báo cáo cửa hàng.' }];
  sending = false;
  constructor(private ai: AiService) {}
  send(e: Event) {
    e.preventDefault();
    if (this.sending) return;
    const form = e.target as HTMLFormElement;
    const q = (form.querySelector('input[name=q]') as HTMLInputElement).value;
    if (!q) return;
    this.messages.push({ role: 'user', text: q });
    this.sending = true;
    const history = this.messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text }));

    this.ai.adminChat(q, history).subscribe((res: any) => {
      this.messages.push({ role: 'assistant', text: res.data?.reply || JSON.stringify(res.data) });
      this.sending = false;
    }, () => {
      this.messages.push({ role: 'assistant', text: 'Không gọi được AI. Kiểm tra AI_API_KEY trên Render.' });
      this.sending = false;
    });
    (form.querySelector('input') as HTMLInputElement).value = '';
  }
}
