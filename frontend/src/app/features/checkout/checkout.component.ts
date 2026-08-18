import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Component({
  template: `
    <h1>Thanh toán</h1>
    <form class="auth-card" (submit)="onCheckout($event)">
      <input name="name" placeholder="Họ tên" required />
      <input name="line1" placeholder="Địa chỉ nhận hàng" required />
      <label>Thanh toán
        <select name="payment">
          <option value="COD">Tiền mặt khi nhận hàng</option>
          <option value="CARD">Thẻ (Stripe)</option>
        </select>
      </label>
      <div id="card-element"></div>
      <button class="btn-primary" type="submit">Đặt hàng</button>
    </form>
  `
})
export class CheckoutComponent implements OnInit, OnDestroy {
  stripe: Stripe | null = null;
  card: any = null;
  constructor(private cart: CartService, private router: Router, private pay: PaymentService) {}
  async ngOnInit() {
    if (environment.stripePublicKey) {
      this.stripe = await loadStripe(environment.stripePublicKey);
      const elements = (this.stripe as any).elements();
      this.card = elements.create('card');
      this.card.mount('#card-element');
    }
  }
  ngOnDestroy() { try { if (this.card) this.card.destroy(); } catch (e) {} }
  onCheckout(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const shippingAddress = { name: fd.get('name'), line1: fd.get('line1') };
    const paymentMethod = (fd.get('payment') as string) || 'COD';
    this.cart.checkout({ shippingAddress, paymentMethod }).subscribe(async (res: any) => {
      const order = res.data;
      if (paymentMethod === 'CARD') {
        this.pay.create(order._id, 'CARD').subscribe(async (p: any) => {
          const clientSecret = p.data && (p.data.clientSecret || p.data.client_secret);
          if (!clientSecret) { alert('Payment setup failed'); this.router.navigate(['/orders']); return; }
          if (!this.stripe || !this.card) { alert('Stripe not initialized'); return; }
          const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, { payment_method: { card: this.card } });
          if ((error as any)) { alert('Payment failed: ' + (error as any).message); this.router.navigate(['/orders']); }
          else { alert('Payment succeeded'); this.router.navigate(['/orders']); }
        }, err => { alert('Payment creation failed'); this.router.navigate(['/orders']); });
      } else {
        alert('Order created'); this.router.navigate(['/orders']);
      }
    });
  }
}
