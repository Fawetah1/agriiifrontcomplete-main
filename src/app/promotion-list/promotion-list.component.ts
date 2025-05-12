import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, interval, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { PromotionUpdateService } from '../services/promotion/promotion-update.service';
import { ProduitService } from '../services/produit.service'; // Assurez-vous que ce chemin est correct
import { format, parse } from 'date-fns';
import { Produit } from '../models/produit.model'; // Importez le modèle Produit correct

// Interface for Page (for paginated responses)
interface Page<T> {
  content: T[];
  pageable: {
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    pageSize: number;
    pageNumber: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// Interface for Promotion
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
  selector: 'app-promotion-list',
  templateUrl: './promotion-list.component.html',
  styleUrls: ['./promotion-list.component.css']
})
export class PromotionListComponent implements OnInit, OnDestroy {
  promotions: Promotion[] = [];
  filteredPromotions: Promotion[] = [];
  paginatedPromotions: Promotion[] = [];
  editMode = false;
  selectedPromotion: Promotion | null = null;
  showingActiveOnly = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading = false;
  isLoadingProducts = false;

  searchTerm = '';
  filterCondition = '';
  filterStartDate = '';
  filterEndDate = '';
  sortColumn: keyof Promotion | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedPromotionIds: Set<number> = new Set<number>();

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  availableProducts: Produit[] = [];
  selectedProductIdToAdd: string | null = null;
  selectedCategory: string | null = null;
  categories: string[] = ['FRUIT', 'LEGUMES', 'LEGUMINEUSE', 'CEREALE'];

  private pollingSubscription: Subscription | null = null;
  private apiUrl = 'http://localhost:8082/promotions';
  private productsApiUrl = 'http://localhost:8082/api/produits';

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private promotionUpdateService: PromotionUpdateService,
    private produitService: ProduitService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPromotions();
    this.loadAvailableProducts();
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.loadPromotions();
    });
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  loadAvailableProducts(): void {
    this.isLoadingProducts = true;
    const cachedProducts = this.produitService.getCachedProducts();
    if (cachedProducts.length > 0) {
      this.availableProducts = cachedProducts.map((product) => ({
        ...product,
        devise: 'TND' as 'TND',
        category: product.category || this.getCategoryForProduct(product.nom)
      }));
      console.log('Produits récupérés depuis le cache :', this.availableProducts);
      this.isLoadingProducts = false;
    } else {
      this.produitService.getAll().subscribe({
        next: (products) => {
          this.availableProducts = products.map((product) => ({
            ...product,
            devise: 'TND' as 'TND',
            category: product.category || this.getCategoryForProduct(product.nom)
          }));
          console.log('Produits chargés depuis l\'API :', this.availableProducts);
          this.produitService.setProducts(this.availableProducts);
          this.isLoadingProducts = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des produits :', err);
          this.errorMessage = 'Erreur lors du chargement des produits.';
          this.clearMessages();
          this.isLoadingProducts = false;
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
    this.selectedProductIdToAdd = null;
    this.updateSelectedProducts();
  }

  onProductsChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedProductIdToAdd = target.value;
    this.addProductToPromotion();
  }

  updateSelectedProducts(): void {
    if (this.selectedCategory && this.selectedPromotion) {
      this.selectedPromotion.produits = this.availableProducts.filter(
        (product) => product.category === this.selectedCategory
      );
      this.cdr.detectChanges();
    }
  }

  loadPromotions(): void {
    this.isLoading = true;
    this.getPromotions()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (data) => {
          console.log('Raw promotions data from backend (loadPromotions):', data);
          this.promotions = data.map((promo) => {
            const storedProduits = localStorage.getItem(`promotion_produits_${promo.id}`);
            const produits = storedProduits ? JSON.parse(storedProduits) : promo.produits || [];
            const mappedPromo = {
              ...promo,
              id: Number(promo.id),
              dateDebut: new Date(promo.dateDebut),
              dateFin: new Date(promo.dateFin),
              produits: produits.map((prod: any) => ({
                ...prod,
                prix: Number(prod.prix),
                devise: prod.devise || 'TND',
                category: prod.category || this.getCategoryForProduct(prod.nom)
              }))
            };
            console.log(`Mapped promotion ${promo.nom}:`, mappedPromo);
            return mappedPromo;
          });
          console.log('All mapped promotions:', this.promotions);
          this.showingActiveOnly = false;
          this.applyFilters();
        },
        (error: HttpErrorResponse) => {
          console.error('Error loading promotions:', error);
          this.errorMessage = `Échec du chargement des promotions: ${error.message}. Vérifiez que le serveur backend est en cours d'exécution et que l'API renvoie un JSON valide.`;
          this.clearMessages();
        }
      );
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.clearMessages();
  }

  private handleError(context: string, error: any): void {
    console.error(`${context}:`, error);
    this.errorMessage = `${context}: ${error.message}. Vérifiez les logs pour plus de détails.`;
    this.clearMessages();
  }

  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.apiUrl, { withCredentials: true });
  }

  getActivePromotions(): void {
    this.isLoading = true;
    this.http
      .get<Promotion[]>(`${this.apiUrl}/actives`, { withCredentials: true })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (data) => {
          this.promotions = data.map((promo) => {
            const storedProduits = localStorage.getItem(`promotion_produits_${promo.id}`);
            const produits = storedProduits ? JSON.parse(storedProduits) : promo.produits || [];
            return {
              ...promo,
              id: Number(promo.id),
              dateDebut: new Date(promo.dateDebut),
              dateFin: new Date(promo.dateFin),
              produits: produits.map((prod: any) => ({
                ...prod,
                prix: Number(prod.prix),
                devise: prod.devise || 'TND',
                category: prod.category || this.getCategoryForProduct(prod.nom)
              }))
            };
          });
          this.showingActiveOnly = true;
          this.applyFilters();
        },
        (error) => {
          console.error('Error loading active promotions:', error);
          this.errorMessage = `Échec du chargement des promotions actives: ${error.message}`;
          this.clearMessages();
        }
      );
  }

  editPromotion(promotion: Promotion): void {
    this.isLoading = true;
    this.http
      .get<Promotion>(`${this.apiUrl}/${promotion.id}`, { withCredentials: true })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (data) => {
          console.log('Raw promotion data from backend (editPromotion):', data);
          const storedProduits = localStorage.getItem(`promotion_produits_${data.id}`);
          let produits = storedProduits ? JSON.parse(storedProduits) : data.produits || [];

          if (!produits.length && data.produits?.length) {
            const cachedProducts = this.produitService.getCachedProducts();
            produits = cachedProducts.filter((p) =>
              data.produits?.some((promoProd) => promoProd.id === p.id)
            );
          }

          this.editMode = true;
          this.selectedPromotion = {
            ...data,
            id: Number(data.id),
            dateDebut: new Date(data.dateDebut),
            dateFin: new Date(data.dateFin),
            produits: produits.map((prod: any) => ({
              ...prod,
              prix: Number(prod.prix),
              devise: prod.devise || 'TND',
              category: prod.category || this.getCategoryForProduct(prod.nom)
            }))
          };
          console.log('Fetched promotion for edit:', this.selectedPromotion);
          this.selectedProductIdToAdd = null;
          this.selectedCategory = null;
        },
        (error) => {
          console.error('Error fetching promotion:', error);
          this.errorMessage = `Échec du chargement des détails de la promotion: ${error.message}`;
          this.clearMessages();
        }
      );
  }

  addProductToPromotion(): void {
    if (!this.selectedProductIdToAdd || !this.selectedPromotion) return;

    const productId = Number(this.selectedProductIdToAdd);
    const productToAdd = this.availableProducts.find((product) => product.id === productId);

    if (productToAdd) {
      if (!this.selectedPromotion.produits?.find((p) => p.id === productId)) {
        if (!this.selectedPromotion.produits) {
          this.selectedPromotion.produits = [];
        }
        this.selectedPromotion.produits.push(productToAdd);
        this.cdr.detectChanges();
      } else {
        this.errorMessage = 'Ce produit est déjà associé à la promotion.';
        this.clearMessages();
      }
    }
    this.selectedProductIdToAdd = null;
  }

  removeProductFromPromotion(index: number): void {
    if (this.selectedPromotion && this.selectedPromotion.produits) {
      this.selectedPromotion.produits.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  updatePromotion(): void {
    if (!this.selectedPromotion || !this.validatePromotion(this.selectedPromotion)) return;
    this.isLoading = true;
    const id = this.selectedPromotion.id;
    const localProduits = this.selectedPromotion.produits || [];
    const payload = {
      id: this.selectedPromotion.id,
      nom: this.selectedPromotion.nom,
      pourcentageReduction: this.selectedPromotion.pourcentageReduction,
      dateDebut: this.formatDateForInput(this.selectedPromotion.dateDebut),
      dateFin: this.formatDateForInput(this.selectedPromotion.dateFin),
      conditionPromotion: this.selectedPromotion.conditionPromotion,
      active: this.selectedPromotion.active,
      produitIds: this.selectedPromotion.produits
        ?.map((product) => product.id)
        .filter((id) => id != null)
    };
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http
      .put<Promotion>(`${this.apiUrl}/${id}`, payload, { headers, withCredentials: true })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (updatedPromotion) => {
          console.log('Backend response after update:', updatedPromotion);
          updatedPromotion.id = Number(updatedPromotion.id);
          updatedPromotion.dateDebut = new Date(updatedPromotion.dateDebut);
          updatedPromotion.dateFin = new Date(updatedPromotion.dateFin);
          updatedPromotion.produits = localProduits;
          const index = this.promotions.findIndex((p) => p.id === updatedPromotion.id);
          if (index !== -1) {
            this.promotions[index] = updatedPromotion;
          }
          localStorage.setItem(`promotion_produits_${id}`, JSON.stringify(updatedPromotion.produits));
          this.cancelEdit();
          this.applyFilters();
          this.showSuccess('Promotion mise à jour avec succès !');
          this.promotionUpdateService.notifyUpdates();
        },
        (error) => this.handleError('Échec de la mise à jour de la promotion', error)
      );
  }

  deletePromotion(id: number): void {
    if (!this.isValidId(id)) {
      this.errorMessage = 'ID de promotion invalide.';
      this.clearMessages();
      return;
    }
    const promotion = this.promotions.find((p) => p.id === id);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer "${promotion?.nom}" ?`
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.http
          .delete(`${this.apiUrl}/${id}`, { withCredentials: true })
          .pipe(finalize(() => (this.isLoading = false)))
          .subscribe(
            () => {
              this.promotions = this.promotions.filter((p) => p.id !== id);
              localStorage.removeItem(`promotion_produits_${id}`);
              this.applyFilters();
              this.showSuccess('Promotion supprimée avec succès !');
              this.promotionUpdateService.notifyUpdates();
            },
            (error) => this.handleError('Échec de la suppression de la promotion', error)
          );
      }
    });
  }

  toggleActiveStatus(promotion: Promotion): void {
    if (!this.isValidId(promotion.id)) {
      this.errorMessage = 'ID de promotion invalide.';
      this.clearMessages();
      return;
    }
    this.isLoading = true;
    const payload = {
      active: !promotion.active
    };
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
    this.http
      .put<Promotion>(`${this.apiUrl}/${promotion.id}/toggle-active`, payload, {
        headers,
        withCredentials: true
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (updated) => {
          updated.id = Number(updated.id);
          updated.dateDebut = new Date(updated.dateDebut);
          updated.dateFin = new Date(updated.dateFin);
          updated.produits = updated.produits?.map((prod: any) => ({
            ...prod,
            prix: Number(prod.prix),
            devise: prod.devise || 'TND',
            category: prod.category || this.getCategoryForProduct(prod.nom)
          }));
          const index = this.promotions.findIndex((p) => p.id === updated.id);
          if (index !== -1) {
            this.promotions[index] = updated;
          }
          this.applyFilters();
          this.showSuccess(
            `Promotion ${updated.active ? 'activée' : 'désactivée'} avec succès !`
          );
          this.promotionUpdateService.notifyUpdates();
        },
        (error) => {
          this.handleError(
            `Échec de la ${promotion.active ? 'désactivation' : 'activation'} de la promotion`,
            error
          );
        }
      );
  }

  cancelEdit(): void {
    this.editMode = false;
    this.selectedPromotion = null;
    this.selectedProductIdToAdd = null;
    this.selectedCategory = null;
  }

  clearMessages(): void {
    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
    }, 5000);
  }

  applyFilters(): void {
    let filtered = [...this.promotions];
    if (this.searchTerm.trim()) {
      filtered = filtered.filter((promotion) =>
        promotion.nom.toLowerCase().includes(this.searchTerm.trim().toLowerCase())
      );
    }
    if (this.filterCondition) {
      filtered = filtered.filter(
        (promotion) => promotion.conditionPromotion === this.filterCondition
      );
    }
    if (this.filterStartDate) {
      const startDate = parse(this.filterStartDate, 'yyyy-MM-dd', new Date());
      filtered = filtered.filter(
        (promotion) => new Date(promotion.dateDebut) >= startDate
      );
    }
    if (this.filterEndDate) {
      const endDate = parse(this.filterEndDate, 'yyyy-MM-dd', new Date());
      filtered = filtered.filter((promotion) => new Date(promotion.dateFin) <= endDate);
    }
    this.filteredPromotions = filtered;
    console.log('Filtered promotions:', this.filteredPromotions);
    if (this.sortColumn) {
      this.sortPromotions(this.sortColumn);
    }
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPromotions.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedPromotions = this.filteredPromotions.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterCondition = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  sortPromotions(column: keyof Promotion): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filteredPromotions.sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];
      if (
        (valueA instanceof Date || typeof valueA === 'string') &&
        (valueB instanceof Date || typeof valueB === 'string')
      ) {
        const dateA = new Date(valueA);
        const dateB = new Date(valueB);
        return this.sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      return 0;
    });
    this.updatePagination();
  }

  toggleSelection(id: number): void {
    if (!this.isValidId(id)) {
      this.errorMessage = 'ID de promotion invalide dans la sélection.';
      this.clearMessages();
      return;
    }
    if (this.selectedPromotionIds.has(id)) {
      this.selectedPromotionIds.delete(id);
    } else {
      this.selectedPromotionIds.add(id);
    }
  }

  selectAll(): void {
    this.paginatedPromotions.forEach((promotion) => {
      if (this.isValidId(promotion.id)) {
        this.selectedPromotionIds.add(promotion.id);
      }
    });
  }

  deselectAll(): void {
    this.selectedPromotionIds.clear();
  }

  bulkActivate(): void {
    const ids = Array.from(this.selectedPromotionIds);
    if (ids.length === 0) return;
    if (!ids.every((id) => this.isValidId(id))) {
      this.errorMessage = 'Un ou plusieurs IDs de promotion sélectionnés sont invalides.';
      this.clearMessages();
      return;
    }
    this.isLoading = true;
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http
      .post(`${this.apiUrl}/bulk-activate`, ids, { headers, withCredentials: true })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          this.loadPromotions();
          this.selectedPromotionIds.clear();
          this.showSuccess('Promotions sélectionnées activées avec succès !');
          this.promotionUpdateService.notifyUpdates();
        },
        (error) =>
          this.handleError("Échec de l'activation des promotions sélectionnées", error)
      );
  }

  bulkDeactivate(): void {
    const ids = Array.from(this.selectedPromotionIds);
    if (ids.length === 0) return;
    if (!ids.every((id) => this.isValidId(id))) {
      this.errorMessage = 'Un ou plusieurs IDs de promotion sélectionnés sont invalides.';
      this.clearMessages();
      return;
    }
    this.isLoading = true;
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http
      .post(`${this.apiUrl}/bulk-deactivate`, ids, { headers, withCredentials: true })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          this.loadPromotions();
          this.selectedPromotionIds.clear();
          this.showSuccess('Promotions sélectionnées désactivées avec succès !');
        },
        (error) =>
          this.handleError('Échec de la désactivation des promotions sélectionnées', error)
      );
  }

  bulkDelete(): void {
    const ids = Array.from(this.selectedPromotionIds);
    if (ids.length === 0) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la suppression en masse',
        message: `Vous êtes sur le point de supprimer ${ids.length} promotions.`,
        warning: 'Cette action est irréversible !'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        const headers = new HttpHeaders().set('Content-Type', 'application/json');
        this.http
          .post(`${this.apiUrl}/bulk-delete`, ids, { headers, withCredentials: true })
          .pipe(finalize(() => (this.isLoading = false)))
          .subscribe(
            () => {
              this.promotions = this.promotions.filter(
                (p) => !this.selectedPromotionIds.has(p.id)
              );
              ids.forEach((id) => localStorage.removeItem(`promotion_produits_${id}`));
              this.applyFilters();
              this.selectedPromotionIds.clear();
              this.showSuccess(`${ids.length} promotions supprimées !`);
            },
            (error) => this.handleError('Échec de la suppression en masse', error)
          );
      }
    });
  }

  exportPromotionsToCSV(): void {
    const headers = ['ID', 'Nom', 'Réduction (%)', 'Date Début', 'Date Fin', 'Condition', 'Active'];
    const csvRows = [headers.join(',')];
    for (const promotion of this.promotions) {
      const row = [
        promotion.id,
        `"${promotion.nom}"`,
        promotion.pourcentageReduction,
        format(new Date(promotion.dateDebut), 'yyyy-MM-dd'),
        format(new Date(promotion.dateFin), 'yyyy-MM-dd'),
        promotion.conditionPromotion || 'N/A',
        promotion.active ? 'Oui' : 'Non'
      ];
      csvRows.push(row.join(','));
    }
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'promotions.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
    if (new Date(promotion.dateDebut) > new Date(promotion.dateFin)) {
      this.errorMessage = 'La date de fin doit être après la date de début.';
      this.clearMessages();
      return false;
    }
    if (!promotion.produits || promotion.produits.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins un produit.';
      this.clearMessages();
      return false;
    }
    return true;
  }

  calculateDiscountedPrice(originalPrice: number, pourcentageReduction: number): number {
    const discount = (originalPrice * pourcentageReduction) / 100;
    return Number((originalPrice - discount).toFixed(2));
  }

  formatDateForInput(date: Date | string): string {
    return format(new Date(date), 'yyyy-MM-dd');
  }

  parseDateFromInput(dateString: string): Date {
    return parse(dateString, 'yyyy-MM-dd', new Date());
  }

  get selectedPromotionStartDate(): string {
    return this.selectedPromotion ? this.formatDateForInput(this.selectedPromotion.dateDebut) : '';
  }

  set selectedPromotionStartDate(value: string) {
    if (this.selectedPromotion) {
      this.selectedPromotion.dateDebut = this.parseDateFromInput(value);
    }
  }

  get selectedPromotionEndDate(): string {
    return this.selectedPromotion ? this.formatDateForInput(this.selectedPromotion.dateFin) : '';
  }

  set selectedPromotionEndDate(value: string) {
    if (this.selectedPromotion) {
      this.selectedPromotion.dateFin = this.parseDateFromInput(value);
    }
  }

  isAISuggested(promotion: Promotion): boolean {
    return promotion.nom.startsWith('AI Suggested Promotion for ');
  }

  acceptAISuggestion(id: number): void {
    if (!this.isValidId(id)) {
      this.errorMessage = 'ID de promotion invalide.';
      this.clearMessages();
      return;
    }
    this.isLoading = true;
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http
      .put<Promotion>(
        `${this.apiUrl}/${id}`,
        { ...this.promotions.find((p) => p.id === id), active: true },
        { headers, withCredentials: true }
      )
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (updatedPromotion) => {
          updatedPromotion.id = Number(updatedPromotion.id);
          updatedPromotion.dateDebut = new Date(updatedPromotion.dateDebut);
          updatedPromotion.dateFin = new Date(updatedPromotion.dateFin);
          updatedPromotion.produits = updatedPromotion.produits?.map((prod: any) => ({
            ...prod,
            prix: Number(prod.prix),
            devise: prod.devise || 'TND',
            category: prod.category || this.getCategoryForProduct(prod.nom)
          }));
          const index = this.promotions.findIndex((p) => p.id === updatedPromotion.id);
          if (index !== -1) {
            this.promotions[index] = updatedPromotion;
          }
          this.applyFilters();
          this.showSuccess('Suggestion IA acceptée !');
          this.promotionUpdateService.notifyUpdates();
        },
        (error) => this.handleError("Échec de l'acceptation de la suggestion IA", error)
      );
  }

  rejectAISuggestion(id: number): void {
    const promotion = this.promotions.find((p) => p.id === id);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer le rejet',
        message: `Voulez-vous vraiment rejeter la suggestion IA "${promotion?.nom}" ?`
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (!this.isValidId(id)) {
          this.errorMessage = 'ID de promotion invalide.';
          this.clearMessages();
          return;
        }
        this.isLoading = true;
        this.http
          .delete(`${this.apiUrl}/${id}`, { withCredentials: true })
          .pipe(finalize(() => (this.isLoading = false)))
          .subscribe(
            () => {
              this.promotions = this.promotions.filter((p) => p.id !== id);
              localStorage.removeItem(`promotion_produits_${id}`);
              this.applyFilters();
              this.showSuccess('Suggestion IA rejetée !');
            },
            (error) => this.handleError('Échec du rejet de la suggestion IA', error)
          );
      }
    });
  }

  private isValidId(id: number): boolean {
    return !isNaN(id) && id > 0;
  }
}