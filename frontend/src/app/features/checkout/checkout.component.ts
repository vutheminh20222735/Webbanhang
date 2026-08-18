import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Component({
  template: `
    <h2>Checkout</h2>
    <form (submit)="onCheckout($event)">
      <input name="name" placeholder="Full name" required />
      <input name="line1" placeholder="Address line 1" required />
      <label>Payment
        <select name="payment">
          <option value="COD">Cash on Delivery</option>
          <option value="CARD">Card (Stripe)</option>
        </select>
      </label>
      <div id="card-element" style="margin-top:12px"></div>
      <button>Place order</button>
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
