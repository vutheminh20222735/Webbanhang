import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminAiComponent } from './admin-ai.component';
import { AdminProductsComponent } from './admin-products.component';
import { AdminOrdersComponent } from './admin-orders.component';
import { AdminUsersComponent } from './admin-users.component';
import { AdminCouponsComponent } from './admin-coupons.component';

import { RoleGuard } from '../../core/guards/role.guard';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminAiComponent,
    AdminProductsComponent,
    AdminOrdersComponent,
    AdminUsersComponent,
    AdminCouponsComponent
  ],

  imports: [
    CommonModule,
    FormsModule,

    RouterModule.forChild([
      {
        path: '',
        component: AdminDashboardComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['ADMIN', 'MANAGER', 'STAFF']
        }
      },

      {
        path: 'ai',
        component: AdminAiComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['ADMIN', 'MANAGER']
        }
      },

      {
        path: 'products',
        component: AdminProductsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['ADMIN', 'MANAGER', 'STAFF']
        }
      },

      {
        path: 'orders',
        component: AdminOrdersComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['ADMIN', 'MANAGER', 'STAFF']
        }
      },

      {
        path: 'users',
        component: AdminUsersComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['ADMIN']
        }
      },

      {
        path: 'coupons',
        component: AdminCouponsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['ADMIN']
        }
      }
    ])
  ]
})
export class AdminModule {}