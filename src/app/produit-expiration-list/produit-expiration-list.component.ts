import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Interface pour les promotions
export interface Promotion {
  id?: number; // Optionnel car les promotions fictives n'ont pas d'ID
  nom: string;
  pourcentageReduction: number;
  dateDebut: string; // Format ISO or YYYY-MM-DD
  dateFin: string;   // Format ISO or YYYY-MM-DD
  conditionPromotion: string | null; // Peut être null pour les promotions manuelles
  active: boolean;
  produits?: Produit[];
  dateActivationPrevue?: string; // Nouveau champ pour la date d'activation prévue
  isAISuggested?: boolean; // Champ pour identifier les suggestions IA
  waitingForDetection?: boolean; // Nouveau champ pour indiquer un état "En attente"
}

// Interface pour les produits
export interface Produit {
  id: number;
  nom: string;
  prix: number;
  devise: string;
  dateExpiration: string; // Format ISO or YYYY-MM-DD
  promotions: Promotion[];
}

@Component({
  selector: 'app-produit-expiration-list',
  templateUrl: './produit-expiration-list.component.html',
  styleUrls: ['./produit-expiration-list.component.css']
})
export class ProduitExpirationListComponent implements OnInit {
  promotionsAutomatiques: Promotion[] = [];
  promotionExpirationActive: Promotion | null = null; // Promotion "Expiration Produit" active
  isLoadingPromotions = true;
  errorMessagePromotions: string | null = null;
  private readonly useMockDataInProduction = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoadingPromotions = true;
    this.errorMessagePromotions = null;
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.http.get<{ blackFriday: any[], expiration: any[], lowSales: any[] }>('http://localhost:8082/promotions/dynamic')
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorMessagePromotions = 'Erreur lors du chargement des promotions. Veuillez réessayer.';
          this.isLoadingPromotions = false;
          if (this.useMockDataInProduction) {
            this.useMockData();
          }
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Données brutes du backend :', data);

          // Combiner les promotions Black Friday, Expiration et Low Sales
          const allPromotions = [
            ...(data.blackFriday || []),
            ...(data.expiration || []),
            ...(data.lowSales || [])
          ];

          // Définir explicitement mappedPromotions comme Promotion[]
          const mappedPromotions: Promotion[] = allPromotions.map(promo => ({
            id: promo.id,
            nom: promo.nom,
            pourcentageReduction: promo.pourcentage_reduction,
            dateDebut: promo.date_debut,
            dateFin: promo.date_fin,
            conditionPromotion: promo.condition_promotion,
            active: promo.active,
            dateActivationPrevue: promo.date_activation_prevue,
            isAISuggested: promo.nom.startsWith('AI Suggested Promotion for '),
            waitingForDetection: false,
            produits: promo.produits?.map((produit: any) => ({
              id: produit.id,
              nom: produit.nom,
              prix: Number(produit.prix) || 0,
              devise: produit.devise || 'TND',
              dateExpiration: produit.dateExpiration, // Fixed: Match API field name (was date_expiration)
              promotions: produit.promotions || []
            })) || []
          }));

          // Vérifier si une promotion "AI Suggested" existe déjà
          const hasAISuggestedPromo = mappedPromotions.some(promo => promo.isAISuggested);

          // Si aucune promotion "AI Suggested" n'est présente, ajouter une promotion par défaut "En attente"
          if (!hasAISuggestedPromo) {
            const today = new Date().toISOString();
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const defaultAISuggestedPromo: Promotion = {
              nom: 'AI Suggested Promotion',
              pourcentageReduction: 0,
              dateDebut: today,
              dateFin: nextWeek.toISOString(),
              conditionPromotion: 'En attente de détection',
              active: false,
              isAISuggested: true,
              waitingForDetection: true,
              produits: []
            };
            mappedPromotions.push(defaultAISuggestedPromo);
          }

          this.promotionsAutomatiques = mappedPromotions;

          console.log('Promotions automatiques après mapping :', this.promotionsAutomatiques);

          // Recherche de la promotion active "Expiration Produit"
          this.promotionExpirationActive = this.promotionsAutomatiques.find(
            promo => promo.conditionPromotion === 'EXPIRATION_PRODUIT' && promo.active
          ) || null;

          this.isLoadingPromotions = false;
        },
        error: (error) => {
          console.error('Erreur inattendue lors du chargement des promotions:', error);
        }
      });
  }

  useMockData(): void {
    const today = new Date().toISOString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    this.promotionsAutomatiques = [
      {
        id: 1,
        nom: 'Promotion Expiration Produit',
        pourcentageReduction: 40,
        conditionPromotion: 'EXPIRATION_PRODUIT',
        active: true,
        dateDebut: '2025-04-20T00:00:00.000+00:00',
        dateFin: '2025-04-24T00:00:00.000+00:00',
        isAISuggested: false,
        waitingForDetection: false,
        produits: [
          { id: 1, nom: 'Produit 1', prix: 18, devise: 'TND', dateExpiration: '2025-04-22T00:00:00.000+00:00', promotions: [] },
          { id: 2, nom: 'Produit 2', prix: 50, devise: 'TND', dateExpiration: '2025-04-24T00:00:00.000+00:00', promotions: [] },
          { id: 3, nom: 'Produit Test 1', prix: 72, devise: 'TND', dateExpiration: '2025-04-24T00:00:00.000+00:00', promotions: [] }
        ]
      },
      {
        id: 2,
        nom: 'Black Friday',
        pourcentageReduction: 50,
        conditionPromotion: 'BLACK_FRIDAY',
        active: false,
        dateDebut: '2025-11-24T00:00:00.000+00:00',
        dateFin: '2025-11-27T00:00:00.000+00:00',
        dateActivationPrevue: '2025-11-25',
        isAISuggested: false,
        waitingForDetection: false,
        produits: [
          { id: 3, nom: 'Produit 3', prix: 20.0, devise: 'TND', dateExpiration: '2025-12-31T00:00:00.000+00:00', promotions: [] }
        ]
      },
      // Promotion "AI Suggested" par défaut
      {
        nom: 'AI Suggested Promotion',
        pourcentageReduction: 0,
        conditionPromotion: 'En attente de détection',
        active: false,
        dateDebut: today,
        dateFin: nextWeek.toISOString(),
        isAISuggested: true,
        waitingForDetection: true,
        produits: []
      }
    ];

    this.promotionExpirationActive = this.promotionsAutomatiques.find(
      promo => promo.conditionPromotion === 'EXPIRATION_PRODUIT' && promo.active
    ) || null;
  }

  getPrixInitial(produit: Produit): number {
    if (!this.promotionExpirationActive || this.promotionExpirationActive.pourcentageReduction === 0) {
      return produit.prix;
    }
    const reduction = this.promotionExpirationActive.pourcentageReduction;
    const prixInitial = produit.prix / (1 - reduction / 100);
    return Number(prixInitial.toFixed(2));
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Non spécifiée';

    let date: Date;
    // Check if the string matches YYYY-MM-DD format
    const dateParts = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateParts) {
      // Parse as local date to avoid timezone issues
      date = new Date(
        parseInt(dateParts[1], 10), // Year
        parseInt(dateParts[2], 10) - 1, // Month (0-based)
        parseInt(dateParts[3], 10) // Day
      );
    } else {
      // Fallback to default parsing for other formats (e.g., ISO 8601)
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) return 'Non spécifiée';

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Nouvelle méthode pour formater la conditionPromotion
  formatCondition(condition: string | null): string {
    if (!condition) return 'Aucune';
    switch (condition) {
      case 'EXPIRATION_PRODUIT':
        return 'Expiration Produit';
      case 'MONTANT_MIN':
        return 'Montant Minimum';
      case 'BLACK_FRIDAY':
        return 'Black Friday';
      case 'EXPIRATION_AND_LOW_SALES':
        return 'Expiration et Faibles Ventes';
      case 'En attente de détection':
        return 'En attente de détection';
      default:
        return condition;
    }
  }

  // Debug method to log date values (optional, can be removed after testing)
  debugDate(date: any): string {
    console.log('Date:', date);
    return '';
  }
  
}