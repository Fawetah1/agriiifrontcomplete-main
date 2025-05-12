import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface User {
  id?: number;
  nom: string;
  email: string;
  numeroDeTelephone: string;
  creditLimit: number;
}

interface Produit {
  id?: number;
  nom: string;
  description: string;
  prix: number;
}

interface TransactionPaiement {
  id: number;
  paymentStatus: string;
  paymentIntentId?: string;
  montant: number;
  dateTransaction: string;
  methodePaiement: string;
}

interface Commande {
  id?: number;
  clientNom: string;
  total?: number;
  status: string;
  dateCreation?: string;
  telephone: string;
  gouvernement: string;
  adresse: string;
  user: User;
  transactions?: TransactionPaiement[];
}

interface LigneFacture {
  id?: number;
  produit: Produit;
  qte: number;
  prixUnitaire: number;
  total: number;
  ttc: number;
}

interface Facture {
  id: number;
  commande: Commande;
  montantTotal: number;
  dateFacture: string;
  numeroFacture: string;
  user: User;
  lignesFacture: LigneFacture[];
}

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private apiUrl = 'http://localhost:8082/api/factures';

  constructor(private http: HttpClient) {}

  getAllFactures(): Observable<Facture[]> {
    return this.http.get<Facture[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching factures:', error);
        return throwError(() => new Error('Failed to fetch factures'));
      })
    );
  }

  getFactureById(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching facture by ID:', error);
        return throwError(() => new Error('Failed to fetch facture'));
      })
    );
  }

  getFactureByTransactionId(transactionId: number): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/by-transaction/${transactionId}`).pipe(
      catchError(error => {
        console.error('Error fetching factures by transaction ID:', error);
        return throwError(() => new Error('Failed to fetch factures by transaction ID'));
      })
    );
  }

  createFacture(facture: Facture): Observable<Facture> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<Facture>(this.apiUrl, facture, { headers }).pipe(
      catchError(error => {
        console.error('Error creating facture:', error);
        return throwError(() => new Error('Failed to create facture'));
      })
    );
  }

  downloadFacturePDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error downloading facture PDF:', error);
        return throwError(() => new Error('Failed to download facture PDF'));
      })
    );
  }
}