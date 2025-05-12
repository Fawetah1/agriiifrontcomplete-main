import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Produit } from '../models/produit.model';

@Injectable({
    providedIn: 'root'
})
export class StockPurchaseService {
    private apiUrl = 'http://localhost:8082/api';

    constructor(private http: HttpClient) {}

    getProduits(): Observable<Produit[]> {
        return this.http.get<Produit[]>(`${this.apiUrl}/produits`).pipe(
            catchError(error => {
                const errorMsg = this.extractErrorMessage(error);
                console.error('Erreur lors de la récupération des produits:', errorMsg);
                return throwError(() => new Error(errorMsg));
            })
        );
    }

    enregistrerEntree(idProduit: number, quantite: number): Observable<string> {
      console.log('Enregistrement entrée - ID:', idProduit, 'Quantité:', quantite);
      return this.http.post(`${this.apiUrl}/stock/${idProduit}/entree`, null, {
          params: new HttpParams().set('quantite', quantite.toString()),
          responseType: 'text' // Ajout du type de réponse texte
      }).pipe(
          catchError(error => {
              const errorMsg = this.extractErrorMessage(error);
              console.error('Erreur lors de l\'enregistrement de l\'entrée:', error.status, errorMsg);
              return throwError(() => new Error(errorMsg));
          })
      );
  }
  
  enregistrerPerte(idProduit: number, quantite: number): Observable<string> {
      console.log('Enregistrement perte - ID:', idProduit, 'Quantité:', quantite);
      return this.http.post(`${this.apiUrl}/stock/${idProduit}/perte`, null, {
          params: new HttpParams().set('quantite', quantite.toString()),
          responseType: 'text' // Ajout du type de réponse texte
      }).pipe(
          catchError(error => {
              const errorMsg = this.extractErrorMessage(error);
              console.error('Erreur lors de l\'enregistrement de la perte:', error.status, errorMsg);
              return throwError(() => new Error(errorMsg));
          })
      );
  }
    createPurchase(userId: number, produitIds: number[]): Observable<string> {
        console.log('Enregistrement achat - UserID:', userId, 'Produit IDs:', produitIds);
        return this.http.post<string>(`${this.apiUrl}/purchases/create?userId=${userId}`, produitIds, {
            responseType: 'text' as 'json'
        }).pipe(
            catchError(error => {
                const errorMsg = this.extractErrorMessage(error);
                console.error('Erreur lors de l\'enregistrement de l\'achat:', error.status, errorMsg);
                return throwError(() => new Error(errorMsg));
            })
        );
    }

    getTopSellingProducts(limit: number = 5): Observable<Produit[]> {
        return this.http.get<Produit[]>(`${this.apiUrl}/produits/top-selling`, {
            params: new HttpParams().set('limit', limit.toString())
        }).pipe(
            catchError(error => {
                const errorMsg = this.extractErrorMessage(error);
                console.error('Erreur lors de la récupération des produits les plus vendus:', errorMsg);
                return throwError(() => new Error(errorMsg));
            })
        );
    }

    private extractErrorMessage(error: any): string {
        if (error.error instanceof Object) {
            // Si l'erreur est un objet JSON, on essaie d'extraire un message
            return error.error.message || error.error.error || JSON.stringify(error.error);
        }
        return error.error || error.statusText || 'Erreur inconnue';
    }
}