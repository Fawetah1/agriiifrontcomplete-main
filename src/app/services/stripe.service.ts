import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { catchError } from 'rxjs/operators';

interface TransactionResponse {
  clientSecret: string;
  transactionId: string;
}

interface TransactionPaiement {
  id?: number;
  montant: number;
  paymentStatus: string;
  dateTransaction: string;
  methodePaiement: string;
  paymentIntentId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private card: StripeCardElement | null = null;
  private publishableKey: string = 'pk_test_51RHZBGHB9dIBgi5iUlb7ekpSMgB2JNIGY0ovZolKA9FldCD7BH6goUOeQdcUnzNV5vgWtdmQT0lHlbJrBvpLWzNq00WrYiEB9V';
  private isInitialized: boolean = false;
  private apiUrl = 'http://localhost:8082/api/transactions'; // Updated base URL (removed /commande)

  constructor(private http: HttpClient) {}

  async initializeStripe(): Promise<void> {
    if (this.isInitialized) {
      console.log('StripeService already initialized.');
      return;
    }

    try {
      console.log('Attempting to load Stripe.js with Publishable Key:', this.publishableKey);
      this.stripe = await loadStripe(this.publishableKey);
      if (!this.stripe) {
        throw new Error('Stripe.js failed to load.');
      }
      console.log('Stripe.js loaded successfully in StripeService.');

      this.elements = this.stripe.elements();
      if (!this.elements) {
        throw new Error('Failed to initialize Stripe Elements.');
      }
      console.log('Stripe Elements initialized successfully.');

      this.isInitialized = true;
    } catch (error) {
      console.error('Error in StripeService initialization:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  isStripeInitialized(): boolean {
    return this.isInitialized;
  }

  getStripe(): Stripe | null {
    return this.stripe;
  }

  createCardElement(): StripeCardElement | null {
    if (!this.isInitialized || !this.elements) {
      console.error('Stripe Elements not initialized in StripeService. Initialization status:', this.isInitialized);
      return null;
    }
    try {
      this.card = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: 'Arial, sans-serif',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#e74c3c',
          },
        },
      });
      console.log('Stripe card element created successfully.');
      return this.card;
    } catch (error) {
      console.error('Error creating Stripe card element:', error);
      return null;
    }
  }

  getCardElement(): StripeCardElement | null {
    return this.card;
  }

  async confirmCardPayment(clientSecret: string, paymentMethodData: any): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized.');
    }
    return this.stripe.confirmCardPayment(clientSecret, paymentMethodData);
  }

  createTransaction(commandeId: number, transaction: TransactionPaiement): Observable<TransactionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<TransactionResponse>(
      `${this.apiUrl}/commande/${commandeId}`,
      transaction,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('HTTP Error in createTransaction:', error);
        let errorMessage = 'Failed to create transaction';
        if (error.status === 400 && error.error) {
          errorMessage = error.error || 'Bad Request';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  updateTransactionStatus(transactionId: number, status: string): Observable<TransactionPaiement> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put<TransactionPaiement>(
      `${this.apiUrl}/${transactionId}/status`,
      { status },
      { headers }
    ).pipe(
      catchError(error => {
        console.error('HTTP Error in updateTransactionStatus:', error);
        let errorMessage = 'Failed to update transaction status';
        if (error.status === 400 && error.error) {
          errorMessage = error.error || 'Bad Request';
        } else if (error.status === 404) {
          errorMessage = 'Transaction not found';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getTransactionById(id: number): Observable<TransactionPaiement> {
    return this.http.get<TransactionPaiement>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('HTTP Error in getTransactionById:', error);
        return throwError(() => new Error('Failed to retrieve transaction'));
      })
    );
  }

  getTransactionsByCommandeId(commandeId: number): Observable<TransactionPaiement[]> {
    return this.http.get<TransactionPaiement[]>(`${this.apiUrl}/commande/${commandeId}`).pipe(
      catchError(error => {
        console.error('HTTP Error in getTransactionsByCommandeId:', error);
        return throwError(() => new Error('Failed to retrieve transactions'));
      })
    );
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('HTTP Error in deleteTransaction:', error);
        return throwError(() => new Error('Failed to delete transaction'));
      })
    );
  }

  // Updated method for multiple commandes
  createTransactionForMultipleCommandes(transaction: any): Observable<{ clientSecret: string, transactionId: string }> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<{ clientSecret: string, transactionId: string }>(
      `${this.apiUrl}/commande/multiple`, // Fixed URL path
      transaction,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('HTTP Error in createTransactionForMultipleCommandes:', error);
        let errorMessage = 'Failed to create transaction for multiple commandes';
        if (error.status === 400 && error.error) {
          errorMessage = error.error || 'Bad Request';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  updateTransactionStatusForMultipleCommandes(transactionId: number, status: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put<any>(
      `${this.apiUrl}/${transactionId}/status`, // Fixed URL path
      { status },
      { headers }
    ).pipe(
      catchError(error => {
        console.error('HTTP Error in updateTransactionStatusForMultipleCommandes:', error);
        let errorMessage = 'Failed to update transaction status for multiple commandes';
        if (error.status === 400 && error.error) {
          errorMessage = error.error || 'Bad Request';
        } else if (error.status === 404) {
          errorMessage = 'Transaction not found';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}