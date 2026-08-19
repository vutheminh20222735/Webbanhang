import { Component } from '@angular/core';

@Component({
  selector: 'app-account-nav',
  templateUrl: './account-nav.component.html',
  styles: [`
    .account-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .account-tabs a {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 999px;
      padding: 8px 14px;
      font-size: 14px;
      font-weight: 600;
      color: #475569;
    }
    .account-tabs a.active,
    .account-tabs a:hover {
      background: #2563eb;
      border-color: #2563eb;
      color: #fff;
    }
  `]
})
export class AccountNavComponent {}
