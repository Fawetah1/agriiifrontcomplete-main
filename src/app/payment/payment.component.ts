import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { CommandeService } from '../commande/commande.service';
import { StripeService } from '../services/stripe.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface User {
  id?: number;
  name: string;
  creditLimit: number;
}

interface Produit {
  id?: number;
  nom: string;
  image?: string;
  description: string;
  prix: number;
  stock: number;
  user: User;
  tempId?: string;
}

interface LigneCommande {
  id?: number;
  produit: Produit;
  qte: number;
  prixUnitaire: number;
  total: number;
  ttc: number;
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
  lignesCommande: LigneCommande[];
}

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, AfterViewInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef;
  pendingCommandes: Commande[] = [];
  userId: number | null = null;
  card: any;
  cardReady: boolean = false;
  clientSecret: string | null = null;
  transactionId: string | null = null;
  paymentError: string | undefined = undefined;
  isLoading: boolean = false;
  cardholderName: string = '';
  gouvernement: string = '';
  postalCode: string = '';
  cardValid: boolean = false;

  constructor(
    private commandeService: CommandeService,
    private stripeService: StripeService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  async ngOnInit(): Promise<void> {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      this.userId = parseInt(storedUserId, 10);
    } else {
      this.toastr.error('Utilisateur non connecté. Veuillez vous connecter.', 'Erreur');
      this.router.navigate(['/login']);
      return;
    }

    try {
      console.log('Initializing Stripe in ngOnInit...');
      await this.stripeService.initializeStripe();
      if (!this.stripeService.getStripe()) {
        this.toastr.error('Failed to load payment system.', 'Error');
        return;
      }
      console.log('Stripe initialized successfully in ngOnInit.');
    } catch (error) {
      console.error('Error initializing Stripe in ngOnInit:', error);
      this.toastr.error('Failed to load payment system. Please try again later.', 'Error');
      return;
    }

    this.loadPendingCommandes();
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeCardElementWithRetry(5, 1000);
  }

  async initializeCardElementWithRetry(maxRetries: number, delayMs: number): Promise<void> {
    let retries = 0;

    while (retries < maxRetries) {
      if (this.stripeService.isStripeInitialized()) {
        console.log('StripeService is initialized, proceeding to create card element.');
        const stripe = this.stripeService.getStripe();
        if (!stripe) {
          console.error('Stripe not initialized.');
          this.toastr.error('Payment system not initialized.', 'Error');
          return;
        }

        this.card = this.stripeService.createCardElement();
        if (!this.card) {
          console.error('Failed to create Stripe card element.');
          this.toastr.error('Failed to initialize payment form.', 'Error');
          return;
        }

        try {
          this.card.mount(this.cardElementRef.nativeElement);
          console.log('Stripe card element mounted successfully.');

          this.card.on('ready', () => {
            console.log('Stripe card element is ready for input.');
            this.cardReady = true;
            this.cdr.detectChanges();
          });

          this.card.on('change', (event: any) => {
            console.log('Stripe card element change event:', event);
            if (event.error) {
              this.paymentError = event.error.message;
              this.toastr.error(this.paymentError, 'Error');
              this.cardValid = false;
            } else {
              this.paymentError = undefined;
              this.cardValid = event.complete && !event.empty;
            }
            if (!this.cardValid) {
              this.paymentError = 'Please enter valid card details.';
            }
            console.log('Card valid state:', this.cardValid);
            this.cdr.detectChanges();
          });

          return;
        } catch (error) {
          console.error('Failed to mount Stripe card element:', error);
          this.toastr.error('Failed to initialize payment form.', 'Error');
          return;
        }
      } else {
        console.log(`StripeService not yet initialized, retrying (${retries + 1}/${maxRetries})...`);
        retries++;
        await this.delay(delayMs);
      }
    }

    console.error('Max retries reached, StripeService not initialized.');
    this.toastr.error('Payment system failed to initialize after multiple attempts.', 'Error');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  loadPendingCommandes(): void {
    if (!this.userId) {
      this.toastr.error('Utilisateur non identifié.', 'Erreur');
      this.router.navigate(['/login']);
      return;
    }
    this.commandeService.getPendingCommandesByUser(this.userId).subscribe({
      next: (commandes) => {
        this.pendingCommandes = commandes.filter(commande =>
          commande.lignesCommande && 
          commande.lignesCommande.length > 0
        );
        console.log('Pending commandes loaded:', this.pendingCommandes);
        if (this.pendingCommandes.length === 0) {
          this.toastr.warning('Aucune commande en attente à payer.', 'Information');
          this.router.navigate(['/commande']);
          return;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading pending commandes:', error);
        this.toastr.error('Échec du chargement des commandes.', 'Erreur');
        this.router.navigate(['/commande']);
      }
    });
  }

  getCombinedTotal(): number {
    return this.pendingCommandes.reduce((total, commande) => total + (commande.total || 0), 0);
  }

  resetPaymentState(): void {
    this.clientSecret = null;
    this.transactionId = null;
    this.paymentError = undefined;
    this.isLoading = false;
    if (this.card) {
      this.card.clear();
    }
    this.cardValid = false;
    this.cardholderName = '';
    this.gouvernement = '';
    this.postalCode = '';
    this.cdr.detectChanges();
  }

  async createTransaction(): Promise<void> {
    if (this.pendingCommandes.length === 0) {
      throw new Error('Aucune commande en attente à traiter');
    }

    const commandeIds = this.pendingCommandes
      .filter(commande => commande.id !== undefined)
      .map(commande => commande.id!);
    if (commandeIds.length === 0) {
      throw new Error('Aucun ID de commande valide trouvé');
    }

    const now = new Date();
    const dateTransaction = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + 'T' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

    const transaction = {
      montant: this.getCombinedTotal(),
      paymentStatus: 'created',
      dateTransaction: dateTransaction,
      methodePaiement: 'card',
      commandeIds: commandeIds
    };

    try {
      const response = await new Promise<{ clientSecret: string, transactionId: string }>((resolve, reject) => {
        this.stripeService.createTransactionForMultipleCommandes(transaction)
          .pipe(
            catchError(error => {
              console.error('Error in createTransactionForMultipleCommandes:', error);
              return throwError(() => error);
            })
          )
          .subscribe({
            next: (res) => resolve(res),
            error: (err) => reject(err)
          });
      });

      this.clientSecret = response.clientSecret;
      this.transactionId = response.transactionId;
      console.log('Transaction created for multiple commandes, clientSecret:', this.clientSecret);
    } catch (error) {
      console.error('Error creating transaction:', error);
      let errorMessage = 'Erreur inconnue';
      if (error instanceof HttpErrorResponse) {
        errorMessage = error.error?.error || error.message || 'Mauvaise requête';
      } else if (error instanceof Error) {
        errorMessage = error.message || 'Erreur inconnue';
      }
      this.toastr.error('Échec de la configuration du paiement : ' + errorMessage, 'Erreur');
      throw error;
    }
  }

  async updateTransactionStatus(status: 'succeeded' | 'failed'): Promise<void> {
    if (!this.transactionId) {
      throw new Error('ID de transaction non disponible');
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.stripeService.updateTransactionStatusForMultipleCommandes(Number(this.transactionId), status)
          .pipe(
            catchError(error => {
              console.error('Error in updateTransactionStatusForMultipleCommandes:', error);
              return throwError(() => error);
            })
          )
          .subscribe({
            next: () => resolve(),
            error: (err) => reject(err)
          });
      });

      console.log(`Transaction status updated to ${status} for multiple commandes`);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      let errorMessage = 'Échec de la mise à jour de l’état du paiement';
      if (error instanceof HttpErrorResponse) {
        errorMessage = error.error?.error || error.message || 'Mauvaise requête';
      } else if (error instanceof Error) {
        errorMessage = error.message || 'Erreur inconnue';
      }
      this.toastr.error(errorMessage, 'Erreur');
      throw error;
    }
  }

  async proceedToCheckout(): Promise<void> {
    if (!this.cardReady) {
      this.toastr.error('Le formulaire de paiement n’est pas prêt. Veuillez patienter et réessayer.', 'Erreur');
      return;
    }

    if (this.pendingCommandes.length === 0) {
      this.toastr.error('Aucune commande à traiter.', 'Erreur');
      return;
    }

    if (!this.cardholderName.trim()) {
      this.toastr.error('Veuillez entrer le nom du titulaire de la carte.', 'Erreur');
      return;
    }

    if (!this.gouvernement) {
      this.toastr.error('Veuillez sélectionner un gouvernorat.', 'Erreur');
      return;
    }

    if (!this.postalCode.trim()) {
      this.toastr.error('Veuillez entrer un code postal.', 'Erreur');
      return;
    }

    if (!this.cardValid) {
      this.toastr.error('Veuillez entrer des détails de carte valides.', 'Erreur');
      return;
    }

    this.isLoading = true;
    this.paymentError = undefined;

    try {
      await this.createTransaction();

      if (!this.clientSecret) {
        this.toastr.error('La configuration du paiement est manquante. Veuillez réessayer plus tard.', 'Erreur');
        return;
      }

      const result = await this.stripeService.confirmCardPayment(this.clientSecret, {
        payment_method: {
          card: this.card,
          billing_details: {
            name: this.cardholderName,
            address: {
              country: 'TN',
              state: this.gouvernement,
              postal_code: this.postalCode
            }
          }
        }
      });

      if (result.error) {
        this.paymentError = result.error.message ?? 'Une erreur inconnue est survenue';
        this.toastr.error(this.paymentError, 'Échec du paiement');
        await this.updateTransactionStatus('failed');
        return;
      }

      if (result.paymentIntent.status === 'succeeded') {
        await this.updateTransactionStatus('succeeded');
        this.pendingCommandes.forEach(commande => {
          commande.status = 'PAID';
        });
        this.toastr.success('Paiement réussi pour toutes les commandes en attente !', 'Succès');
        this.router.navigate(['/success']);
      }
    } catch (error) {
      let errorMessage = 'Une erreur inattendue est survenue lors du paiement';
      if (error instanceof HttpErrorResponse) {
        errorMessage = error.error?.error || error.message || 'Mauvaise requête';
      } else if (error instanceof Error) {
        errorMessage = error.message || 'Erreur inconnue';
      }
      this.paymentError = errorMessage;
      this.toastr.error(this.paymentError, 'Erreur');
      console.error('Payment error:', error);
      if (this.transactionId) {
        await this.updateTransactionStatus('failed').catch(err => {
          console.error('Failed to update transaction status to failed:', err);
        });
      }
    } finally {
      this.isLoading = false;
      this.resetPaymentState();
    }
  }
}