import { Component } from '@angular/core';
import { AiService } from '../../core/services/ai.service';

@Component({
  template: `
    <h3>Admin AI Assistant</h3>
    <div>
      <form (submit)="send($event)">
        <input name="q" placeholder="Ask admin AI (e.g. Doanh thu tháng này)" style="width:60%" />
        <button>Ask</button>
      </form>
      <div *ngIf="response">{{response | json}}</div>
    </div>
  `
})
export class AdminAiComponent {
  response: any;
  constructor(private ai: AiService) {}
  send(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const q = (form.querySelector('input[name=q]') as HTMLInputElement).value;
    if (!q) return;
    this.ai.adminChat(q).subscribe((res: any) => this.response = res.data, err => this.response = { error: 'failed' });
    (form.querySelector('input') as HTMLInputElement).value = '';
  }
}
