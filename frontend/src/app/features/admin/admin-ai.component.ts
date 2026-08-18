import { Component } from '@angular/core';
import { AiService } from '../../core/services/ai.service';

@Component({
  templateUrl: './admin-ai.component.html',
  styleUrls: ['./admin-ai.component.scss']
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
