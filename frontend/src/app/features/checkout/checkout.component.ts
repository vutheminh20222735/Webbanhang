import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { AddressService } from '../../core/services/address.service';

@Component({
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {

  stripe: Stripe | null = null;
  card: any = null;

  cartItems: any[] = [];

  total = 0;
  subtotal = 0;
  discountAmount = 0;
  shippingFee = 30000;

  isProcessing = false;
  isApplyingCoupon = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  couponCode = '';
  appliedCoupon: any = null;
  shipping = { name: '', email: '', phone: '', line1: '', city: '', district: '' };

  constructor(
    private cart: CartService,
    private router: Router,
    private pay: PaymentService,
    private addresses: AddressService
  ) {}

  async ngOnInit(): Promise<void> {

    this.loadCartItems();

    if (environment.stripePublicKey) {
      this.stripe = await loadStripe(environment.stripePublicKey);

      if (this.stripe) {
        const elements = this.stripe.elements();

        this.card = elements.create('card');
        this.card.mount('#card-element');
      }
    }
  }

  // =========================
  // LOAD SELECTED CART ITEMS
  // =========================

  loadCartItems(): void {

    const storedItems = sessionStorage.getItem('checkoutItems');

    if (!storedItems) {
      this.router.navigate(['/cart']);
      return;
    }

    try {

      this.cartItems = JSON.parse(storedItems);

      if (!Array.isArray(this.cartItems) || this.cartItems.length === 0) {
        this.router.navigate(['/cart']);
        return;
      }

      this.calculateSubtotal();
      this.calculateTotal();
      this.addresses.load().subscribe((items) => {
        const def = items.find((a) => a.isDefault) || items[0];
        if (def) {
          this.shipping = {
            name: def.name || '',
            email: this.shipping.email,
            phone: def.phone || '',
            line1: def.line1 || '',
            city: def.city || '',
            district: def.district || ''
          };
        }
      });

    } catch (error) {

      console.error(
        'Không thể đọc sản phẩm thanh toán:',
        error
      );

      sessionStorage.removeItem('checkoutItems');

      this.router.navigate(['/cart']);
    }
  }

  // =========================
  // CALCULATE PRICE
  // =========================

  calculateSubtotal(): void {

    this.subtotal = this.cartItems.reduce(
      (total, item) => {

        const price =
          Number(item.priceAt || item.price || item.product?.salePrice || item.product?.price || 0);

        const quantity =
          Number(item.quantity || 0);

        return total + price * quantity;

      },
      0
    );
  }

  calculateTotal(): void {

    this.total =
      this.subtotal -
      this.discountAmount +
      this.shippingFee;

    if (this.total < 0) {
      this.total = 0;
    }
  }

  // =========================
  // APPLY COUPON
  // =========================

  applyCoupon(): void {

    const code = this.couponCode.trim();

    if (!code) {
      this.showMessage(
        'Vui lòng nhập mã giảm giá',
        'error'
      );

      return;
    }

    if (this.isApplyingCoupon) {
      return;
    }

    this.isApplyingCoupon = true;

    this.cart.applyCoupon(code, this.subtotal).subscribe({

      next: (res: any) => {

        this.isApplyingCoupon = false;

        const coupon = res?.data;

        if (!coupon) {

          this.appliedCoupon = null;
          this.discountAmount = 0;

          this.calculateTotal();

          this.showMessage(
            'Mã giảm giá không hợp lệ',
            'error'
          );

          return;
        }

        this.appliedCoupon = coupon;

        this.discountAmount = Number(
          coupon.discountAmount ??
          coupon.discount ??
          0
        );

        this.calculateTotal();

        this.showMessage(
          'Áp dụng mã giảm giá thành công!',
          'success'
        );
      },

      error: (err) => {

        this.isApplyingCoupon = false;

        this.appliedCoupon = null;
        this.discountAmount = 0;

        this.calculateTotal();

        this.showMessage(
          err.error?.message ||
          'Mã giảm giá không hợp lệ hoặc đã hết hạn',
          'error'
        );
      }

    });
  }

  // =========================
  // REMOVE COUPON
  // =========================

  removeCoupon(): void {

    this.couponCode = '';
    this.discountAmount = 0;
    this.appliedCoupon = null;

    this.calculateTotal();
  }

  // =========================
  // MESSAGE
  // =========================

  showMessage(
    msg: string,
    type: 'success' | 'error'
  ): void {

    this.message = msg;
    this.messageType = type;

    setTimeout(() => {
      this.message = '';
    }, 4000);
  }

  // =========================
  // CHECKOUT
  // =========================

  itemName(item: any): string {
    return item?.name || item?.product?.name || item?.productId?.name || 'Sản phẩm';
  }

  itemPrice(item: any): number {
    return Number(item?.priceAt || item?.price || item?.product?.salePrice || item?.product?.price || 0);
  }

  itemImage(item: any): string {
    return item?.product?.images?.[0] || item?.productId?.image || item?.image || 'assets/placeholder.png';
  }

  onCheckout(e: Event): void {

    e.preventDefault();

    if (this.isProcessing) {
      return;
    }

    if (this.cartItems.length === 0) {
      this.showMessage(
        'Không có sản phẩm để thanh toán',
        'error'
      );

      return;
    }

    const itemIds = this.cart.selectedItemIds(this.cartItems);
    if (!itemIds.length) {
      this.showMessage('Không xác định được sản phẩm trong giỏ. Vui lòng quay lại giỏ hàng.', 'error');
      return;
    }

    this.isProcessing = true;

    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    const shippingAddress = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      line1: fd.get('line1'),
      city: fd.get('city'),
      district: fd.get('district')
    };

    const paymentMethod =
      (fd.get('payment') as string) || 'COD';

    const payload = {
      itemIds,
      shippingAddress,
      paymentMethod,
      couponCode: this.appliedCoupon
        ? this.appliedCoupon.code
        : null
    };

    this.cart.checkout(payload).subscribe({

      next: (res: any) => {

        const order = res.data;

        if (paymentMethod === 'CARD') {

          this.pay.create(
            order._id,
            'CARD'
          ).subscribe({

            next: async (p: any) => {

              const clientSecret =
                p.data &&
                (
                  p.data.clientSecret ||
                  p.data.client_secret
                );

              if (!clientSecret) {

                alert('Payment setup failed');

                this.isProcessing = false;

                return;
              }

              if (!this.stripe || !this.card) {

                alert('Stripe not initialized');

                this.isProcessing = false;

                return;
              }

              const {
                error
              } = await this.stripe.confirmCardPayment(
                clientSecret,
                {
                  payment_method: {
                    card: this.card
                  }
                }
              );

              if (error) {

                alert(
                  'Payment failed: ' +
                  error.message
                );

                this.isProcessing = false;
                this.router.navigate(['/orders']);

              } else {

                alert('Payment succeeded');

                sessionStorage.removeItem(
                  'checkoutItems'
                );

                this.cart.refresh();
                this.router.navigate(['/orders']);
              }
            },

            error: () => {

              alert('Payment creation failed');

              this.isProcessing = false;

              this.router.navigate(['/orders']);
            }

          });

        } else {

          sessionStorage.removeItem(
            'checkoutItems'
          );

          this.cart.refresh();
          this.router.navigate(['/orders']);
        }
      },

      error: (err) => {

        this.isProcessing = false;

        this.showMessage(
          err.error?.message ||
          err.message ||
          'Đặt hàng thất bại, giỏ hàng được giữ nguyên',
          'error'
        );
      }

    });
  }

  // =========================
  // DESTROY
  // =========================

  ngOnDestroy(): void {

    try {

      if (this.card) {
        this.card.destroy();
      }

    } catch (e) {}
  }
}