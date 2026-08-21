import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';

interface ProductGroup {
  key: string;
  name: string;
  products: any[];
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  group: 'phone' | 'accessory' | string;
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

  categories: CategoryItem[] = [];
  brands: string[] = [];
  selectedCategory = '';
  selectedGroup = '';
  selectedBrand = '';
  searchQuery = '';
  priceRange = { min: 0, max: 100000000 };
  sortBy = 'newest';
  filterOpen = false;
  isLoading = false;
  brandsExpanded = false;
  brandPreviewCount = 5;

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  get visibleBrands(): string[] {
    if (this.brandsExpanded) return this.brands;
    return this.brands.slice(0, this.brandPreviewCount);
  }

  get phoneCategories(): CategoryItem[] {
    return this.categories.filter((c) => c.group !== 'accessory');
  }

  get accessoryCategories(): CategoryItem[] {
    return this.categories.filter((c) => c.group === 'accessory');
  }

  get accessoryCategoryIds(): string[] {
    return this.accessoryCategories.map((c) => c.id);
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category'] || '';
      this.selectedGroup = params['group'] || '';
      this.selectedBrand = params['brand'] || '';
      this.searchQuery = params['q'] || '';
      this.applyFilters();
    });
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.selectedCategory ||
      this.selectedGroup ||
      this.selectedBrand ||
      this.searchQuery ||
      this.sortBy !== 'newest' ||
      this.priceRange.min > 0 ||
      this.priceRange.max < 100000000
    );
  }

  loadCategories() {
    this.http.get(`${environment.apiUrl}/products/categories`).subscribe((res: any) => {
      const items = res.data?.items || res.data || [];
      this.categories = (Array.isArray(items) ? items : []).map((c: any) => ({
        id: String(c._id || c.id || ''),
        name: c.name || 'Khác',
        slug: c.slug || '',
        group: c.group || 'phone'
      })).filter((c: any) => c.id);
      this.applyFilters();
    });
  }

  loadProducts() {
    this.isLoading = true;
    this.http.get(`${environment.apiUrl}/products?limit=200`).subscribe(
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

  categoryMeta(p: any): CategoryItem | undefined {
    return this.categories.find((x) => x.id === this.categoryId(p));
  }

  categoryName(p: any): string {
    const c = p?.category;
    if (c && typeof c === 'object' && c.name) return c.name;
    const found = this.categoryMeta(p);
    if (found) return found.name;
    return p?.brand || 'Khác';
  }

  findCategoryBySlug(slug: string): CategoryItem | undefined {
    return this.categories.find((c) => c.slug === slug);
  }

  /** Lọc theo slug danh mục (Smartphone / Gaming / Camera Phone) */
  filterBySlug(slug: string) {
    const cat = this.findCategoryBySlug(slug);
    this.router.navigate(['/'], {
      queryParams: cat ? { category: cat.id } : {},
      queryParamsHandling: ''
    });
  }

  /** Lọc toàn bộ phụ kiện (3 danh mục con) */
  filterAccessories() {
    this.router.navigate(['/'], {
      queryParams: { group: 'accessory' },
      queryParamsHandling: ''
    });
  }

  applyFilters() {
    let filtered = [...this.allProducts];

    if (this.selectedGroup === 'accessory') {
      const ids = new Set(this.accessoryCategoryIds);
      filtered = filtered.filter((p) => {
        if (p.productType === 'accessory') return true;
        return ids.has(this.categoryId(p));
      });
    } else if (this.selectedCategory) {
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
    this.selectedGroup = '';
    this.selectedBrand = '';
    this.searchQuery = '';
    this.priceRange = { min: 0, max: 100000000 };
    this.sortBy = 'newest';
    this.router.navigate(['/'], { queryParams: {} });
    this.applyFilters();
  }

  onPriceChange() { this.applyFilters(); }
  onSortChange() { this.applyFilters(); }
  closeFilter() { this.filterOpen = false; }

  onBrandChange(brand: string, checked: boolean) {
    this.selectedBrand = checked ? brand : '';
    this.applyFilters();
  }

  onCategorySelect(id: string) {
    this.selectedCategory = id;
    this.selectedGroup = '';
    this.applyFilters();
  }

  scrollGroup(key: string, dir: number) {
    const el = document.querySelector(`[data-row="${key}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollBy({ left: dir * 260, behavior: 'smooth' });
  }
}
