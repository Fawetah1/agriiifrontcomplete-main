import { Component, OnInit } from '@angular/core';
import { ProduitService } from '../services/produit.service';
import { Produit } from '../models/produit.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list-client.component.html',
  styleUrls: ['./product-list-client.component.css']
})
export class ProductListClientComponent implements OnInit {
  products: Produit[] = [];

  constructor(
    private produitService: ProduitService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.produitService.getAll().subscribe({
      next: (response: any) => {
        this.products = response.content || response;
        console.log('Produits chargés :', this.products);
        this.produitService.setProducts(this.products);
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
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
    imgElement.src = '/assets/img/placeholder.jpg';
  }

  editProduct(productId: number | undefined): void {
    if (productId) {
      this.router.navigate(['/produit-create', productId]);
    }
  }
  acheterProduit(product: any) {
    console.log('Produit acheté:', product.nom);
    // Ici tu peux ajouter la logique d'ajout au panier
  }
  

  deleteProduct(productId: number | undefined): void {
    if (productId && confirm('Are you sure you want to delete this product?')) {
      this.produitService.delete(productId).subscribe({
        next: () => {
          this.products = this.products.filter(product => product.id !== productId);
          this.produitService.setProducts(this.products);
          alert('Product deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          alert('Error deleting product');
        }
      });
    }
  }
}