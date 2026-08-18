import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit {
  products: any[] = [];
  allProducts: any[] = [];
  placeholder = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';

  // Filters
  categories: string[] = [];
  brands: string[] = [];
  selectedCategory = '';
  selectedBrand = '';
  priceRange = { min: 0, max: 100000000 };
  sortBy = 'newest';

  isLoading = false;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadProducts();
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
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
      (err) => {
        console.error('Failed to load products', err);
        this.isLoading = false;
      }
    );
  }

  extractFilters() {
    const categoriesSet = new Set<string>();
    const brandsSet = new Set<string>();

    this.allProducts.forEach((p) => {
      if (p.category) categoriesSet.add(p.category);
      if (p.brand) brandsSet.add(p.brand);
    });

    this.categories = Array.from(categoriesSet).sort();
    this.brands = Array.from(brandsSet).sort();
  }

  applyFilters() {
    let filtered = [...this.allProducts];

    if (this.selectedCategory) {
      filtered = filtered.filter((p) => p.category === this.selectedCategory);
    }

    if (this.selectedBrand) {
      filtered = filtered.filter((p) => p.brand === this.selectedBrand);
    }

    const effectivePrice = this.priceRange.max || 100000000;
    filtered = filtered.filter(
      (p) => (p.salePrice || p.price) >= this.priceRange.min && (p.salePrice || p.price) <= effectivePrice
    );

    // Sort
    if (this.sortBy === 'price-asc') {
      filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (this.sortBy === 'price-desc') {
      filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (this.sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    // 'newest' is default (no sort)

    this.products = filtered;
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedBrand = '';
    this.priceRange = { min: 0, max: 100000000 };
    this.sortBy = 'newest';
    this.applyFilters();
  }

  onPriceChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }
}
