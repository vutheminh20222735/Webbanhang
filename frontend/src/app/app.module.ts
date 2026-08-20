import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { CustomerLayoutComponent } from './layouts/customer-layout/customer-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ForbiddenComponent } from './core/components/forbidden.component';
import { ChatbotComponent } from './core/components/chatbot/chatbot.component';
import { ShopChatComponent } from './core/components/shop-chat/shop-chat.component';
import { RouterModule, Routes } from '@angular/router';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { AuthGuard } from './core/guards/auth.guard';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: '', loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule) },
      { path: 'cart', canActivate: [AuthGuard], loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule) },
      { path: 'checkout', canActivate: [AuthGuard], loadChildren: () => import('./features/checkout/checkout.module').then(m => m.CheckoutModule) },
      { path: 'orders', canActivate: [AuthGuard], loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule) },
      { path: 'account', canActivate: [AuthGuard], loadChildren: () => import('./features/account/account.module').then(m => m.AccountModule) },
      { path: 'login', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
      { path: 'register', loadChildren: () => import('./features/auth/register.module').then(m => m.RegisterModule) },
      { path: 'forgot-password', loadChildren: () => import('./features/auth/forgot-password.module').then(m => m.ForgotPasswordModule) }
    ]
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    component: AdminLayoutComponent,
    children: [
      { path: '', loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) }
    ]
  },
  { path: '403', component: ForbiddenComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [AppComponent, CustomerLayoutComponent, AdminLayoutComponent, ForbiddenComponent, ChatbotComponent, ShopChatComponent],
  imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, FormsModule, CommonModule, RouterModule.forRoot(routes)],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
