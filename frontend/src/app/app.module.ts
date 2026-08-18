import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { CustomerLayoutComponent } from './layouts/customer-layout/customer-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ForbiddenComponent } from './core/components/forbidden.component';
import { ChatbotComponent } from './core/components/chatbot/chatbot.component';
import { RouterModule, Routes } from '@angular/router';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

const routes: Routes = [
  { path: '', loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule) },
  { path: 'cart', loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule) },
  { path: 'checkout', loadChildren: () => import('./features/checkout/checkout.module').then(m => m.CheckoutModule) },
  { path: 'orders', loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule) },
  { path: 'account', loadChildren: () => import('./features/account/account.module').then(m => m.AccountModule) },
  { path: 'admin', loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule), canActivate: [/* role guard will be applied inside module */] },
  { path: '403', component: ForbiddenComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [AppComponent, CustomerLayoutComponent, AdminLayoutComponent, ForbiddenComponent, ChatbotComponent],
  imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterModule.forRoot(routes)],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
