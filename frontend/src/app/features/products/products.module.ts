import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductsListComponent } from './products-list.component';
import { ProductDetailComponent } from './product-detail.component';
import { ProductCardComponent } from './product-card.component';
import { WishlistComponent } from './wishlist.component';
import { ReviewsComponent } from './reviews.component';
import { FormsModule } from '@angular/forms';
import { AuthGuard } from '../../core/guards/auth.guard';

@NgModule({
  declarations: [
    ProductsListComponent,
    ProductDetailComponent,
    ProductCardComponent,
    WishlistComponent,
    ReviewsComponent
  ],
  imports: [CommonModule, FormsModule, RouterModule.forChild([
    { path: '', component: ProductsListComponent },
    { path: 'product/:id', component: ProductDetailComponent },
    { path: 'wishlist', canActivate: [AuthGuard], component: WishlistComponent }
  ])]
})
export class ProductsModule {}
