import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileComponent } from './profile.component';
import { AddressManagementComponent } from './address-management.component';
import { AccountReviewsComponent } from './account-reviews.component';
import { AccountNavComponent } from './account-nav.component';

@NgModule({
  declarations: [
    ProfileComponent,
    AddressManagementComponent,
    AccountReviewsComponent,
    AccountNavComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileComponent },
      { path: 'addresses', component: AddressManagementComponent },
      { path: 'reviews', component: AccountReviewsComponent }
    ])
  ]
})
export class AccountModule {}
