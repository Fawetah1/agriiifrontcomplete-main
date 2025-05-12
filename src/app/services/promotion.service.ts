import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Promotion {
  id?: number;
  nom: string;
  pourcentageReduction: number;
  dateDebut: string;
  dateFin: string;
  conditionPromotion: string;
  active?: boolean;
  produits?: any[];
}

export interface PromotionStat {
  promotionId: number;
  promotionName: string;
  usageCount: number;
  totalRevenueImpact: number;
}

export interface AnalyticsResponse {
  totalPromotionsApplied: number;
  promotionStats: PromotionStat[];
}

export interface AnalyticsSummary {
  totalPromotions: number;
  activePromotions: number;
  expiredPromotions: number;
  totalPromotionsApplied: number;
  chartData: { labels: string[]; datasets: { label: string; data: number[] }[] };
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private apiUrl = 'http://localhost:8082/promotions';

  constructor(private http: HttpClient) {}

  // ✅ Ajouter une promotion
  ajouterPromotion(promotion: Promotion): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, promotion, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ✅ Modifier une promotion
  modifierPromotion(id: number, promotion: Promotion): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, promotion, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ✅ Supprimer une promotion
  supprimerPromotion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  // ✅ Récupérer toutes les promotions
  getAllPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}`);
  }

  // ✅ Récupérer les promotions actives
  getActivePromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/actives`);
  }

  // ✅ Récupérer une promotion par ID
  getPromotionById(id: number): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.apiUrl}/${id}`);
  }

  // ✅ Activer une promotion
  activerPromotion(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/activate/${id}`, {});
  }

  // ✅ Désactiver une promotion
  desactiverPromotion(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/deactivate/${id}`, {});
  }

  // ✅ Récupérer les statistiques
  getAnalytics(startDate?: string, endDate?: string): Observable<AnalyticsSummary> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return forkJoin({
      analytics: this.http.get<AnalyticsResponse>(`${this.apiUrl}/analytics`, { params }),
      allPromotions: this.http.get<Promotion[]>(`${this.apiUrl}`, { params }),
      activePromotions: this.http.get<Promotion[]>(`${this.apiUrl}/actives`, { params })
    }).pipe(
      tap(({ analytics, allPromotions, activePromotions }) => {
        console.log('Analytics Response:', analytics);
        console.log('All Promotions Response:', allPromotions);
        console.log('Active Promotions Response:', activePromotions);
      }),
      map(({ analytics, allPromotions, activePromotions }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiredPromotions = allPromotions.filter(promo => {
          const endDate = new Date(promo.dateFin);
          endDate.setHours(0, 0, 0, 0);
          return endDate < today;
        }).length;

        const chartData = {
          labels: analytics.promotionStats.map(stat => stat.promotionName),
          datasets: [
            {
              label: 'Applications',
              data: analytics.promotionStats.map(stat => stat.usageCount)
            }
          ]
        };

        return {
          totalPromotions: allPromotions.length,
          activePromotions: activePromotions.length,
          expiredPromotions: expiredPromotions,
          totalPromotionsApplied: analytics.totalPromotionsApplied,
          chartData: chartData
        };
      }),
      catchError(error => {
        console.error('Error fetching analytics:', error);
        return of({
          totalPromotions: 0,
          activePromotions: 0,
          expiredPromotions: 0,
          totalPromotionsApplied: 0,
          chartData: { labels: [], datasets: [] }
        });
      })
    );
  }
}