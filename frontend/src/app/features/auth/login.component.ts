import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  error = '';
  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}
  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    this.auth.login(email, password).subscribe((res: any) => {
      const token = res.data?.token;
      if (!token) return;
      this.auth.setToken(token);
      const user = this.auth.getUserFromToken();
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      if (returnUrl) this.router.navigateByUrl(returnUrl);
      else this.router.navigate(user && ['ADMIN','MANAGER','STAFF'].includes(user.role) ? ['/admin'] : ['/']);
    }, () => this.error = 'Email hoặc mật khẩu không đúng');
  }
}
