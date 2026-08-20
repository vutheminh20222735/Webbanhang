import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ActivatedRoute } from '@angular/router';

interface ProductGroup {
  key: string;
  name: string;
  products: any[];
}

@Component({
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit {
  products: any[] = [];
  allProducts: any[] = [];
  groupedProducts: ProductGroup[] = [];
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';

  categories: { id: string; name: string }[] = [];
  brands: string[] = [];
  selectedCategory = '';
  selectedBrand = '';
  searchQuery = '';
  priceRange = { min: 0, max: 100000000 };
  sortBy = 'newest';
  filterOpen = false;
  isLoading = false;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category'] || '';
      this.selectedBrand = params['brand'] || '';
      this.searchQuery = params['q'] || '';
      this.applyFilters();
    });
  }

  get hasActiveFilters(): boolean {
    return !!(this.selectedCategory || this.selectedBrand || this.searchQuery || this.sortBy !== 'newest' || this.priceRange.min > 0 || this.priceRange.max < 100000000);
  }

  loadCategories() {
    this.http.get(`${environment.apiUrl}/products/categories`).subscribe((res: any) => {
      const items = res.data?.items || res.data || [];
      this.categories = (Array.isArray(items) ? items : []).map((c: any) => ({
        id: String(c._id || c.id || ''),
        name: c.name || 'Khác'
      })).filter((c: any) => c.id);
      this.applyFilters();
    });
  }

  loadProducts() {
    this.isLoading = true;
    this.http.get(`${environment.apiUrl}/products?limit=100`).subscribe(
      (res: any) => {
        this.allProducts = res.data?.items || [];
        this.extractFilters();
        this.applyFilters();
        this.isLoading = false;
      },
      () => { this.isLoading = false; }
    );
  }

  extractFilters() {
    const brandsSet = new Set<string>();
    this.allProducts.forEach((p) => {
      if (p.brand) brandsSet.add(p.brand);
    });
    this.brands = Array.from(brandsSet).sort();
  }

  categoryId(p: any): string {
    const c = p?.category;
    if (!c) return '';
    if (typeof c === 'object') return String(c._id || c.id || '');
    return String(c);
  }

  categoryName(p: any): string {
    const c = p?.category;
    if (c && typeof c === 'object' && c.name) return c.name;
    const found = this.categories.find((x) => x.id === this.categoryId(p));
    if (found) return found.name;
    return p?.brand || 'Khác';
  }

  applyFilters() {
    let filtered = [...this.allProducts];

    if (this.selectedCategory) {
      filtered = filtered.filter((p) => this.categoryId(p) === this.selectedCategory);
    }
    if (this.selectedBrand) {
      filtered = filtered.filter((p) => p.brand === this.selectedBrand);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.brand || '').toLowerCase().includes(q)
      );
    }

    const max = this.priceRange.max || 100000000;
    filtered = filtered.filter((p) => {
      const price = p.salePrice || p.price;
      return price >= this.priceRange.min && price <= max;
    });

    if (this.sortBy === 'price-asc') {
      filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (this.sortBy === 'price-desc') {
      filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (this.sortBy === 'name') {
      filtered.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    }

    this.products = filtered;
    this.buildGroups();
  }

  buildGroups() {
    const groups = new Map<string, ProductGroup>();
    this.products.forEach((p) => {
      const key = this.categoryId(p) || p.brand || 'other';
      const name = this.categoryName(p);
      if (!groups.has(key)) groups.set(key, { key, name, products: [] });
      groups.get(key)!.products.push(p);
    });
    this.groupedProducts = Array.from(groups.values());
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedBrand = '';
    this.searchQuery = '';
    this.priceRange = { min: 0, max: 100000000 };
    this.sortBy = 'newest';
    this.applyFilters();
  }

  onPriceChange() { this.applyFilters(); }
  onSortChange() { this.applyFilters(); }
  closeFilter() { this.filterOpen = false; }

  onBrandChange(brand: string, checked: boolean) {
    this.selectedBrand = checked ? brand : '';
    this.applyFilters();
  }

  scrollGroup(key: string, dir: number) {
    const el = document.querySelector(`[data-row="${key}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollBy({ left: dir * 260, behavior: 'smooth' });
  }
}
