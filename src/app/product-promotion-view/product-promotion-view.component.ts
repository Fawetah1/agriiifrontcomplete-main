import { Component, OnInit } from '@angular/core';
import { Produit } from '../models/produit.model';
import { PromotionServiceClientService } from '../services/promotion-service-client.service';

interface Promotion {
  id: number;
  nom: string;
  pourcentageReduction: number;
  dateDebut: string;
  dateFin: string;
  conditionPromotion?: string;
  active: boolean;
  produits?: Produit[];
}

@Component({
  selector: 'app-product-promotion-view',
  templateUrl: './product-promotion-view.component.html',
  styleUrls: ['./product-promotion-view.component.css']
})
export class ProductPromotionViewComponent implements OnInit {
product: any;
  acheterProduit(product: any) {
    console.log('Produit acheté:', product.nom);
    // Ici tu peux ajouter la logique d'ajout au panier
  }

  promotions: Promotion[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private promotionServiceClient: PromotionServiceClientService) {}

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.isLoading = true;
    this.promotionServiceClient.getActivePromotions().subscribe({
      next: (promotions) => {
        this.promotions = promotions;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des promotions.';
        this.isLoading = false;
        console.error(error);
      }
    });
  }

  calculateDiscountedPrice(originalPrice: number, pourcentageReduction: number): number {
    const discount = (originalPrice * pourcentageReduction) / 100;
    return Number((originalPrice - discount).toFixed(2));
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}