import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductsListComponent } from './products-list.component';
import { ProductDetailComponent } from './product-detail.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [ProductsListComponent, ProductDetailComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild([
    { path: '', component: ProductsListComponent },
    { path: 'product/:id', component: ProductDetailComponent }
  ])]
})
export class ProductsModule {}
