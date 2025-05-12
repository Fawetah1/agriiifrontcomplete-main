import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Produit } from '../models/produit.model';

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

@Injectable({
  providedIn: 'root'
})
export class PromotionServiceClientService  {
  private apiUrl = 'http://localhost:8082/promotions';
  private cachedPromotions: Promotion[] = [];

  constructor(private http: HttpClient) {}

  getActivePromotions(): Observable<Promotion[]> {
    if (this.cachedPromotions.length > 0) {
      return of(this.cachedPromotions);
    }

    return this.http.get<Promotion[]>(`${this.apiUrl}/actives`, { withCredentials: true }).pipe(
      map((promotions) =>
        promotions.map((promo) => ({
          ...promo,
          dateDebut: new Date(promo.dateDebut).toISOString(),
          dateFin: new Date(promo.dateFin).toISOString(),
          produits: promo.produits?.map((prod) => ({
            ...prod,
            prix: Number(prod.prix),
            devise: prod.devise || 'TND',
            available: prod.available ?? true
          }))
        }))
      ),
      tap((promotions) => (this.cachedPromotions = promotions)),
      catchError((error) => {
        console.error('Erreur lors du chargement des promotions actives:', error);
        return of([]);
      })
    );
  }

  clearCache(): void {
    this.cachedPromotions = [];
  }
}