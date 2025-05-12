import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitService } from '../services/produit.service';
import { Produit } from '../models/produit.model';

@Component({
  selector: 'app-produit-par-categorie',
  templateUrl: './produit-par-categorie.component.html',
  styleUrls: ['./produit-par-categorie.component.css']
})
export class ProduitParCategorieComponent implements OnInit {
  products: Produit[] = [];
  category: string | null = null;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  errorMessage: string | null = null;

  constructor(
    private produitService: ProduitService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.category = params['category'] || null;
      console.log('Category from URL:', this.category);
      this.currentPage = 0; // Reset to first page when category changes
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.errorMessage = null;
    if (this.category) {
      this.produitService.getByCategory(this.category, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          console.log('API Response:', response);
          this.products = response.content || [];
          this.totalPages = response.totalPages || 0;
          if (this.products.length === 0) {
            this.errorMessage = `No products found for category "${this.category}"`;
          }
        },
        error: (err) => {
          console.error('Error fetching products:', err);
          this.errorMessage = 'Failed to load products. Please try again later.';
        }
      });
    } else {
      this.produitService.getAll().subscribe({
        next: (response) => {
          this.products = response;
          this.totalPages = 1; // No pagination for getAll
          if (this.products.length === 0) {
            this.errorMessage = 'No products available.';
          }
        },
        error: (err) => {
          console.error('Error fetching all products:', err);
          this.errorMessage = 'Failed to load products. Please try again later.';
        }
      });
    }
  }

  getImageUrl(image: string | undefined | null): string {
    if (image && image.trim() !== '') {
      if (image.startsWith('http') || image.startsWith('//')) {
        return image;
      }
      return `https://res.cloudinary.com/dmw16ou0b/image/upload/${image}`;
    }
    return 'assets/img/placeholder.jpg';
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/img/placeholder.jpg';
  }

  editProduct(productId: number | undefined): void {
    if (productId) {
      this.router.navigate(['/produit-create', productId]);
    }
  }

  deleteProduct(productId: number | undefined): void {
    if (productId && confirm('Are you sure you want to delete this product?')) {
      this.produitService.delete(productId).subscribe({
        next: () => {
          this.products = this.products.filter(product => product.id !== productId);
          alert('Product deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          alert('Error deleting product');
        }
      });
    }
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }
}