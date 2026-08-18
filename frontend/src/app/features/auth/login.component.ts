import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  template: `
    <form (submit)="onSubmit($event)">
      <input name="email" placeholder="email" />
      <input name="password" type="password" placeholder="password" />
      <button>Login</button>
    </form>
  `
})
export class LoginComponent {
  constructor(private auth: AuthService, private router: Router) {}
  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    this.auth.login(email, password).subscribe((res: any) => {
      const token = res.data?.token;
      if (token) { this.auth.setToken(token); this.router.navigate(['/']); }
    });
  }
}
