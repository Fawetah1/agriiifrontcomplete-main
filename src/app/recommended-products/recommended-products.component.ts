// src/app/recommended-products/recommended-products.component.ts
import { Component, OnInit } from '@angular/core';
import { RecommendationService } from '../services/recommendation.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Produit } from '../models/produit.model';

@Component({
  selector: 'app-recommended-products',
  templateUrl: './recommended-products.component.html',
  styleUrls: ['./recommended-products.component.css']
})
export class RecommendedProductsComponent implements OnInit {
  recommendedProducts: Produit[] = [];
  isLoadingRecommendations: boolean = true;
  errorMessage: string | null = null;
  private userId = 2;

  constructor(
    private recommendationService: RecommendationService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadRecommendedProducts();
  }
  getImageUrl(image: any): string {
    if (typeof image === 'object' && image.changingThisBreaksApplicationSecurity) {
      return image.changingThisBreaksApplicationSecurity;
    }
    return image;
  }
  loadRecommendedProducts(): void {
    console.log('Chargement des recommandations pour userId:', this.userId);
    this.isLoadingRecommendations = true;
    this.recommendationService.getRecommendedProducts(this.userId, 6).subscribe({
      next: (produits: any[]) => {
        console.log('Réponse brute de l\'API:', produits);
        if (!produits || produits.length === 0) {
          console.warn('Aucune recommandation reçue de l\'API');
          this.recommendedProducts = [];
        } else {
          this.recommendedProducts = produits.map(produit => {
            const mappedProduct: Produit = {
              id: produit.id || 0,
              nom: produit.nom || 'Nom inconnu',
              prix: produit.prix || 0,
              devise: produit.devise || 'MAD',
              image: produit.image && produit.image.trim() !== ''
                ? produit.image // Keep as string
                : 'assets/images/placeholder.jpg',
              stock: produit.stock || 0,
              available: produit.available !== undefined ? produit.available : true,
              description: produit.description,
              taxe: produit.taxe,
              dateExpiration: produit.dateExpiration,
              fournisseur: produit.fournisseur,
              fournisseurId: produit.fournisseurId,
              seuilMin: produit.seuilMin,
              autoReapprovisionnement: produit.autoReapprovisionnement,
              quantiteReapprovisionnement: produit.quantiteReapprovisionnement,
              category: produit.category,
              salesCount: produit.salesCount,
              quantity: 1
            };
            console.log('Produit mappé:', mappedProduct);
            return mappedProduct;
          });
        }
        console.log('recommendedProducts final:', this.recommendedProducts);
        this.isLoadingRecommendations = false;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des recommandations:', err);
        this.errorMessage = 'Erreur lors du chargement des recommandations. Veuillez réessayer plus tard.';
        this.recommendedProducts = [];
        this.isLoadingRecommendations = false;
      }
    });
  }

  // Method to sanitize the image URL for display
  sanitizeImageUrl(image: string | undefined): SafeUrl {
    if (image && image.trim() !== '') {
      return this.sanitizer.bypassSecurityTrustUrl(image);
    }
    return this.sanitizer.bypassSecurityTrustUrl('assets/images/placeholder.jpg');
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== '/assets/img/placeholder.jpg') {
      img.src = '/assets/img/placeholder.jpg';
    }
  }

  addToCart(product: Produit): void {
    console.log(`Ajouté ${product.nom} au panier: ID=${product.id}, Quantité=${product.quantity}`);
  }

  toggleWishlist(product: Produit): void {
    console.log(`Toggle wishlist pour ${product.nom} (ID: ${product.id})`);
  }

  trackByProductId(index: number, product: Produit): number {
    return product.id || 0;
  }
}