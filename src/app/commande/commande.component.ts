import { Component, OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { CommandeService } from './commande.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

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

interface TransactionPaiement {
  id: number;
  paymentStatus: string;
  paymentIntentId?: string;
  montant: number;
  dateTransaction: string;
  methodePaiement: string;
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
  transactions?: TransactionPaiement[]; // Added transactions property
}

@Component({
  selector: 'app-commande',
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.css']
})
export class CommandeComponent implements OnInit {
  commandes: Commande[] = [];
  userId: number | null = null;
  wishlist: Produit[] = [];
  isLoggedIn: boolean = false;

  currentUser: any = {};
  showProfileMenu: boolean = false;

  constructor(
    private commandeService: CommandeService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('currentUser');

    if (raw && raw !== 'null') {
      try {
        const user = JSON.parse(raw);
        this.currentUser = user;
        this.isLoggedIn = !!(user && user.id);
      } catch (e) {
        console.error('Erreur de parsing currentUser:', e);
        this.isLoggedIn = false;
      }
    } else {
      this.isLoggedIn = false;
    }

    
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      this.userId = parseInt(storedUserId, 10);
      console.log('User ID found in localStorage:', this.userId);
      this.loadCommandesByUser();
    } else {
      console.log('No user ID found in localStorage, redirecting to login...');
      this.toastr.error('Utilisateur non connecté. Veuillez vous connecter.', 'Erreur');
      this.router.navigate(['/login']);
    }
    this.loadWishlistFromStorage();
  }
  onLogout(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/home']).then(() => {
      window.location.reload(); // Recalcule isLoggedIn
    });
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }
   
  onGoToMyAccount(): void {
    this.router.navigate(['/my-account']);
  }

  loadCommandesByUser(): void {
    if (!this.userId) {
      console.log('User ID is null, redirecting to login...');
      this.toastr.error('Utilisateur non identifié.', 'Erreur');
      this.router.navigate(['/login']);
      return;
    }
    console.log('Fetching commandes for userId:', this.userId);
    this.commandeService.getCommandesByUser(this.userId).subscribe({
      next: (commandes: Commande[]) => {
        console.log('Commandes received:', commandes);
        console.log('Number of commandes:', commandes.length);
        commandes.forEach(commande => {
          console.log(`Commande #${commande.id} user:`, commande.user);
        });
        this.commandes = commandes.filter(commande => commande.user?.id === this.userId);
        console.log('Filtered commandes for userId:', this.commandes);
        if (this.commandes.length !== commandes.length) {
          console.warn('Some commandes were filtered out due to user mismatch.');
        }
        this.commandes.forEach(commande => {
          console.log(`Commande #${commande.id}:`, {
            clientNom: commande.clientNom,
            total: commande.total,
            lignesCommande: commande.lignesCommande.length,
            transactions: commande.transactions
          });
          commande.lignesCommande.forEach(ligne => {
            console.log(`Produit in Commande #${commande.id}:`, ligne.produit.nom);
            if (!ligne.produit.id) {
              ligne.produit.tempId = `${ligne.produit.nom}-${Date.now()}`;
              console.log(`Generated tempId for ${ligne.produit.nom}:`, ligne.produit.tempId);
            }
          });
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des commandes:', err);
        this.toastr.error('Failed to load orders. Please try again later.', 'Error');
      }
    });
  }
  loadWishlistFromStorage(): void {
    const storedWishlist = localStorage.getItem('wishlist');
    if (storedWishlist) {
      this.wishlist = JSON.parse(storedWishlist);
      console.log('Wishlist loaded from localStorage:', this.wishlist);
    } else {
      console.log('No wishlist found in localStorage');
    }
  }

  addToWishlist(produit: Produit): void {
    console.log('addToWishlist called for:', produit.nom);
    console.log('Produit details:', produit);
    const identifier = produit.id ?? produit.tempId;
    console.log('Identifier used:', identifier);

    if (!identifier) {
      console.error('Cannot add product to wishlist: missing identifier');
      this.toastr.error('Cannot add product to wishlist: missing identifier', 'Error');
      return;
    }

    const isInWishlist = this.wishlist.some(item => (item.id ?? item.tempId) === identifier);
    console.log('Is product already in wishlist?', isInWishlist);

    if (!isInWishlist) {
      this.wishlist.push(produit);
      console.log('Wishlist after adding:', this.wishlist);
      localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
      this.toastr.success(`${produit.nom} added to wishlist!`, 'Success');
      setTimeout(() => this.cdr.detectChanges(), 0);
    } else {
      this.toastr.warning(`${produit.nom} is already in your wishlist!`, 'Warning');
    }
  }

  isInWishlist(produit: Produit): boolean {
    const identifier = produit.id ?? produit.tempId;
    const result = this.wishlist.some(item => (item.id ?? item.tempId) === identifier);
    console.log(`isInWishlist check for ${produit.nom} (identifier: ${identifier}):`, result);
    console.log('Current wishlist:', this.wishlist);
    return result;
  }

  getWishlistCount(): number {
    const count = this.wishlist.length;
    console.log('Wishlist count:', count);
    return count;
  }

  navigateToWishlist(): void {
    const storedUserId = localStorage.getItem('currentUserId');
    if (!storedUserId) {
      this.toastr.error('Utilisateur non connecté. Veuillez vous connecter.', 'Erreur');
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/wishlist']);
  }

  increaseQuantity(commande: Commande, ligne: LigneCommande): void {
    if (ligne.qte >= 2) {
      alert('Limite de 2 pièces par option et client.');
      return;
    }
    ligne.qte += 1;
    this.updateQuantity(commande, ligne);
  }

  decreaseQuantity(commande: Commande, ligne: LigneCommande): void {
    if (ligne.qte > 1) {
      ligne.qte -= 1;
      this.updateQuantity(commande, ligne);
    }
  }

  updateQuantity(commande: Commande, ligne: LigneCommande): void {
    if (ligne.qte < 1) {
      ligne.qte = 1;
    }
    ligne.total = ligne.qte * ligne.prixUnitaire;
    ligne.ttc = ligne.total * 1.19;
    commande.total = commande.lignesCommande.reduce((sum, l) => sum + l.total, 0);

    this.commandeService.updateCommande(commande.id!, {
      ...commande,
      lignesCommande: commande.lignesCommande
    }).subscribe({
      next: (updated: Commande) => {
        console.log('Commande mise à jour:', updated);
        const index = this.commandes.findIndex(cmd => cmd.id === updated.id);
        if (index !== -1) {
          this.commandes[index] = updated;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erreur lors de la mise à jour:', err)
    });
  }

  updateQuantityOnChange(commande: Commande, ligne: LigneCommande, newValue: number): void {
    ligne.qte = newValue;
    this.updateQuantity(commande, ligne);
  }

  deleteLigneCommande(commande: Commande, ligne: LigneCommande): void {
    if (confirm('Voulez-vous vraiment supprimer ce produit de la commande ?')) {
      commande.lignesCommande = commande.lignesCommande.filter(l => l.id !== ligne.id);
      if (commande.lignesCommande.length === 0) {
        this.commandes = this.commandes.filter(cmd => cmd.id !== commande.id);
      } else {
        commande.total = commande.lignesCommande.reduce((sum, l) => sum + l.total, 0);
        this.commandeService.updateCommande(commande.id!, {
          ...commande,
          lignesCommande: commande.lignesCommande
        }).subscribe({
          next: (updated: Commande) => {
            console.log('Produit supprimé:', updated);
            const index = this.commandes.findIndex(cmd => cmd.id === updated.id);
            if (index !== -1) {
              this.commandes[index] = updated;
              this.cdr.detectChanges();
            }
          },
          error: (err) => console.error('Erreur lors de la suppression:', err)
        });
      }
    }
  }

  getTotalItems(): number {
    return this.commandes.reduce((total, commande) => {
      return total + commande.lignesCommande.reduce((sum, ligne) => sum + ligne.qte, 0);
    }, 0);
  }

  getTotalItemsPrice(): number {
    return this.commandes.reduce((total, commande) => {
      return total + (commande.total || 0);
    }, 0);
  }

  proceedToPayment(commandeId: number | undefined): void {
    const storedUserId = localStorage.getItem('currentUserId');
    if (!storedUserId) {
      this.toastr.error('Utilisateur non connecté. Veuillez vous connecter.', 'Erreur');
      this.router.navigate(['/login']);
      return;
    }
    if (commandeId === undefined) {
      this.toastr.error('ID de commande invalide.', 'Erreur');
      return;
    }
    console.log('Redirecting to payment page for commande:', commandeId);
    this.router.navigate(['/payment', commandeId]);
  }

  proceedToPaymentFromSummary(): void {
    const eligibleCommande = this.commandes.find(commande =>
      commande.id !== undefined &&
      (commande.status === 'PENDING' || commande.status === 'PENDING_PAYMENT')
    );
    if (!eligibleCommande) {
      this.toastr.error('Aucune commande éligible pour le paiement.', 'Erreur');
      return;
    }
    this.proceedToPayment(eligibleCommande.id);
  }

  viewFacture(commande: Commande): void {
    if (commande.status !== 'PAID') {
      this.toastr.error('Cette commande n’est pas encore payée.', 'Erreur');
      return;
    }

    if (!commande.transactions || commande.transactions.length === 0) {
      this.toastr.error('Aucune transaction associée à cette commande.', 'Erreur');
      return;
    }

    const transactionId = commande.transactions[0].id;
    this.router.navigate(['/facture', transactionId]);
  }
}