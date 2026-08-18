import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileComponent } from './profile.component';

@NgModule({
  declarations: [ProfileComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: 'account/profile', component: ProfileComponent }])]
})
export class AccountModule {}
