import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Produit } from '../models/produit.model';
import { RefreshService } from '../services/refresh.service';
import { ProduitService } from '../services/produit.service';
import { format } from 'date-fns';

interface Promotion {
  id: number;
  nom: string;
  pourcentageReduction: number;
  dateDebut: Date | string;
  dateFin: Date | string;
  conditionPromotion: string;
  active: boolean;
  produits?: Produit[];
}

@Component({
  selector: 'app-promotion-add',
  templateUrl: './promotion-add.component.html',
  styleUrls: ['./promotion-add.component.css']
})
export class PromotionAddComponent implements OnInit {
  newPromotion: Promotion = {
    id: 0,
    nom: '',
    pourcentageReduction: 0,
    dateDebut: new Date(),
    dateFin: new Date(),
    conditionPromotion: '',
    active: true,
    produits: []
  };
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading = false;
  categories: string[] = ['FRUIT', 'LEGUMES', 'LEGUMINEUSE', 'CEREALE'];
  products: Produit[] = [];
  selectedCategory: string | null = null;
  selectedProductNames: string[] = [];
  startDate: string = this.formatDateForInput(new Date());
  endDate: string = this.formatDateForInput(new Date());

  private apiUrl = 'http://localhost:8082/promotions';

  constructor(
    private http: HttpClient,
    private router: Router,
    private refreshService: RefreshService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
    this.loadProductsData();
  }

  loadProductsData(): void {
    this.isLoading = true;
    const cachedProducts = this.produitService.getCachedProducts();
    if (cachedProducts.length > 0) {
      this.products = cachedProducts.map((product: Produit) => ({
        ...product,
        devise: 'TND' as 'TND',
        categorie: product.category || this.getCategoryForProduct(product.nom)
      }));
      console.log('Produits récupérés depuis le cache :', this.products);
      this.isLoading = false;
    } else {
      this.produitService.getAll().subscribe({
        next: (products: Produit[]) => {
          this.products = products.map((product: Produit) => ({
            ...product,
            devise: 'TND' as 'TND',
            categorie: product.category || this.getCategoryForProduct(product.nom)
          }));
          console.log('Produits chargés depuis l\'API :', this.products);
          this.produitService.setProducts(this.products);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des produits :', err);
          this.errorMessage = 'Erreur lors du chargement des produits.';
          this.clearMessages();
          this.isLoading = false;
        }
      });
    }
  }

  getCategoryForProduct(nom: string): string {
    const categoryMap: { [key: string]: 'FRUIT' | 'LEGUMES' | 'LEGUMINEUSE' | 'CEREALE' } = {
      'Fraise': 'FRUIT',
      'Pomme': 'FRUIT',
      'Carotte': 'LEGUMES',
      'Poireau': 'LEGUMES',
      'Haricot': 'LEGUMINEUSE',
      'Pois Chiche': 'LEGUMINEUSE',
      'Blé': 'CEREALE',
      'Riz': 'CEREALE'
    };
    return categoryMap[nom] || 'FRUIT';
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory = target.value || null;
    this.selectedProductNames = [];
    this.updateSelectedProducts();
  }

  onProductsChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedProductNames = Array.from(target.selectedOptions).map(option => option.value);
    this.updateSelectedProducts();
  }

  updateSelectedProducts(): void {
    if (this.selectedCategory) {
      this.newPromotion.produits = this.products.filter(product => product.category === this.selectedCategory);
    } else {
      this.newPromotion.produits = this.products.filter(product => this.selectedProductNames.includes(product.nom));
    }
    console.log('Produits sélectionnés pour la promotion :', this.newPromotion.produits);
  }

  addPromotion(): void {
    if (!this.validatePromotion(this.newPromotion)) return;
    this.isLoading = true;

    console.log('Produits associés à la promotion avant envoi :', this.newPromotion.produits);

    const { id, ...promotionSansId } = this.newPromotion;
    const payload = {
      ...promotionSansId,
      dateDebut: this.startDate,
      dateFin: this.endDate,
      produitIds: this.newPromotion.produits?.map(product => product.id).filter(id => id != null)
    };

    console.log('Payload envoyé :', payload);

    this.http.post(this.apiUrl + '/add', payload, { withCredentials: true })
      .subscribe({
        next: (response) => {
          console.log('Réponse reçue:', response);
          this.showSuccess('Promotion ajoutée avec succès !');
          this.refreshService.notifyPromotionUpdated();
          this.resetForm();
          setTimeout(() => this.router.navigate(['/promotions/list']), 2000);
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout de la promotion:', err);
          this.handleError('Échec de l’ajout de la promotion', err);
          this.isLoading = false;
        }
      });
  }

  resetForm(): void {
    this.newPromotion = {
      id: 0,
      nom: '',
      pourcentageReduction: 0,
      dateDebut: new Date(),
      dateFin: new Date(),
      conditionPromotion: '',
      active: true,
      produits: []
    };
    this.startDate = this.formatDateForInput(new Date());
    this.endDate = this.formatDateForInput(new Date());
    this.selectedCategory = null;
    this.selectedProductNames = [];
  }

  validatePromotion(promotion: Promotion): boolean {
    if (!promotion.nom.trim()) {
      this.errorMessage = 'Le nom de l’offre est requis.';
      this.clearMessages();
      return false;
    }
    if (promotion.pourcentageReduction < 0 || promotion.pourcentageReduction > 100) {
      this.errorMessage = 'Le pourcentage de réduction doit être entre 0 et 100.';
      this.clearMessages();
      return false;
    }
    if (new Date(this.startDate) > new Date(this.endDate)) {
      this.errorMessage = 'La date de fin doit être après la date de début.';
      this.clearMessages();
      return false;
    }
    if (!promotion.produits || promotion.produits.length === 0) {
      this.errorMessage = 'Veuillez sélectionner une catégorie ou au moins un produit.';
      this.clearMessages();
      return false;
    }
    return true;
  }

  formatDateForInput(date: Date | string): string {
    return format(new Date(date), 'yyyy-MM-dd');
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.clearMessages();
  }

  private handleError(context: string, error: any): void {
    this.errorMessage = `${context}: ${error.message}`;
    this.clearMessages();
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
    }, 5000);
  }
}