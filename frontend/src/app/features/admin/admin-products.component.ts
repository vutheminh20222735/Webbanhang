import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss']
})
export class AdminProductsComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  error = '';
  ok = '';
  editError = '';
  editOk = '';
  editing: any = null;
  saving = false;
  createType: 'phone' | 'accessory' = 'phone';
  listFilter: 'all' | 'phone' | 'accessory' = 'all';

  constructor(private http: HttpClient, public auth: AuthService) {}
  get canCreate() { return this.auth.hasRole('ADMIN', 'MANAGER'); }
  get canUpdate() { return this.auth.hasRole('ADMIN', 'MANAGER'); }

  get phoneCategories() {
    return this.categories.filter((c) => (c.group || 'phone') === 'phone');
  }

  get accessoryCategories() {
    return this.categories.filter((c) => c.group === 'accessory');
  }

  get filteredProducts() {
    if (this.listFilter === 'all') return this.products;
    return this.products.filter((p) => this.isAccessory(p) === (this.listFilter === 'accessory'));
  }

  ngOnInit() {
    this.load();
    this.http.get(`${environment.apiUrl}/products/categories`).subscribe((res: any) => {
      this.categories = res.data || [];
    });
  }

  load() {
    this.http.get(`${environment.apiUrl}/products`, { params: { limit: 200 } }).subscribe((res: any) => {
      this.products = res.data?.items || [];
    });
  }

  isAccessory(p: any): boolean {
    if (p?.productType === 'accessory') return true;
    if (p?.productType === 'phone') return false;
    const id = this.categoryId(p);
    return this.accessoryCategories.some((c) => String(c._id) === id);
  }

  categoryId(p: any): string {
    const c = p?.category;
    if (!c) return '';
    if (typeof c === 'object') return String(c._id || c.id || '');
    return String(c);
  }

  create(e: Event) {
    e.preventDefault();
    if (!this.canCreate) return;
    this.error = ''; this.ok = '';
    const fd = new FormData(e.target as HTMLFormElement);
    const body: any = {};
    fd.forEach((v, k) => { if (v !== '') body[k] = v; });
    const name = String(body.name || '');
    body.slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now();
    body.price = Number(body.price);
    if (body.salePrice) body.salePrice = Number(body.salePrice);
    body.stock = Number(body.stock || 0);
    body.productType = this.createType;
    if (body.imageUrl) body.images = [body.imageUrl];
    this.http.post(`${environment.apiUrl}/products`, body).subscribe(() => {
      this.ok = this.createType === 'accessory' ? 'Đã thêm phụ kiện' : 'Đã thêm điện thoại';
      (e.target as HTMLFormElement).reset();
      this.createType = 'phone';
      this.load();
    }, err => this.error = err.error?.message || 'Không thêm được (cần quyền Admin/Manager)');
  }

  startEdit(p: any) {
    if (!this.canUpdate) return;
    this.editError = '';
    this.editOk = '';
    this.editing = {
      _id: p._id,
      name: p.name || '',
      brand: p.brand || '',
      price: p.price ?? '',
      salePrice: p.salePrice ?? '',
      stock: p.stock ?? 0,
      category: this.categoryId(p),
      productType: this.isAccessory(p) ? 'accessory' : 'phone',
      ram: p.ram || '',
      storage: p.storage || '',
      color: p.color || '',
      screen: p.screen || '',
      cpu: p.cpu || '',
      camera: p.camera || '',
      battery: p.battery || '',
      operatingSystem: p.operatingSystem || '',
      imageUrl: (p.images && p.images[0]) || '',
      description: p.description || '',
      status: p.status || 'active',
      featured: !!p.featured
    };
    setTimeout(() => {
      document.getElementById('edit-phone-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  cancelEdit() {
    this.editing = null;
    this.editError = '';
    this.editOk = '';
  }

  saveEdit(e: Event) {
    e.preventDefault();
    if (!this.canUpdate || !this.editing || this.saving) return;
    this.editError = '';
    this.editOk = '';
    this.saving = true;

    const body: any = {
      name: this.editing.name,
      brand: this.editing.brand,
      price: Number(this.editing.price),
      stock: Number(this.editing.stock || 0),
      productType: this.editing.productType || 'phone',
      ram: this.editing.ram || '',
      storage: this.editing.storage || '',
      color: this.editing.color || '',
      screen: this.editing.screen || '',
      cpu: this.editing.cpu || '',
      camera: this.editing.camera || '',
      battery: this.editing.battery || '',
      operatingSystem: this.editing.operatingSystem || '',
      description: this.editing.description || '',
      status: this.editing.status || 'active',
      featured: !!this.editing.featured
    };
    if (this.editing.salePrice === '' || this.editing.salePrice === null) {
      body.salePrice = null;
    } else {
      body.salePrice = Number(this.editing.salePrice);
    }
    if (this.editing.category) body.category = this.editing.category;
    if (this.editing.imageUrl) body.images = [this.editing.imageUrl];

    this.http.put(`${environment.apiUrl}/products/${this.editing._id}`, body).subscribe({
      next: () => {
        this.editOk = 'Đã cập nhật thông tin sản phẩm';
        this.saving = false;
        this.load();
      },
      error: (err) => {
        this.editError = err.error?.message || 'Không lưu được. Kiểm tra quyền Admin/Manager.';
        this.saving = false;
      }
    });
  }

  save(p: any) {
    this.http.put(`${environment.apiUrl}/products/${p._id}`, {
      price: Number(p.price),
      stock: Number(p.stock)
    }).subscribe(() => this.load(), () => alert('Không lưu được'));
  }

  del(p: any) {
    if (!confirm('Xóa sản phẩm?')) return;
    this.http.delete(`${environment.apiUrl}/products/${p._id}`).subscribe(() => {
      if (this.editing && this.editing._id === p._id) this.cancelEdit();
      this.load();
    });
  }
}
