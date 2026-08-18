import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  error = '';
  constructor(private auth: AuthService, private router: Router) {}
  onSubmit(e: Event) {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      password: fd.get('password'),
      role: 'CUSTOMER'
    };
    this.auth.register(payload).subscribe((res: any) => {
      const token = res.data?.token;
      if (token) { this.auth.setToken(token); this.router.navigate(['/']); }
    }, err => this.error = err.error?.message || 'Không đăng ký được');
  }
}
