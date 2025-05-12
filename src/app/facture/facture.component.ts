import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FactureService } from './facture.service';
import { HttpErrorResponse } from '@angular/common/http';

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

@Component({
  selector: 'app-facture',
  templateUrl: './facture.component.html',
  styleUrls: ['./facture.component.css']
})
export class FactureComponent implements OnInit {
  facture: Facture | null = null;
  factures: Facture[] = [];
  transactionId: number | null = null;
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private factureService: FactureService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('transactionId');
      if (id) {
        this.transactionId = parseInt(id, 10);
        this.loadFactureByTransactionId();
      } else {
        this.toastr.error('Transaction ID not provided.', 'Erreur');
        this.router.navigate(['/commande']);
      }
    });
  }

  loadFactureByTransactionId(): void {
    if (!this.transactionId) {
      this.toastr.error('Transaction ID is missing.', 'Erreur');
      this.router.navigate(['/commande']);
      return;
    }

    this.isLoading = true;
    this.factureService.getFactureByTransactionId(this.transactionId).subscribe({
      next: (factures) => {
        this.factures = factures;
        this.isLoading = false;
        if (factures.length > 0) {
          this.facture = factures[0]; // Select the first facture for display
        } else {
          this.toastr.warning('Aucune facture trouvée pour cette transaction.', 'Avertissement');
          this.router.navigate(['/commande']);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading factures:', error);
        if (error.status === 404) {
          this.toastr.error('No factures found for this transaction.', 'Erreur');
        } else {
          this.toastr.error('An unexpected error occurred while loading the factures.', 'Erreur');
        }
        this.isLoading = false;
        this.router.navigate(['/commande']);
      }
    });
  }

  downloadPDF(): void {
    if (!this.facture?.id) {
      this.toastr.error('Facture ID is missing.', 'Erreur');
      return;
    }

    this.factureService.downloadFacturePDF(this.facture.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${this.facture!.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toastr.success('Facture PDF downloaded successfully!', 'Succès');
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        this.toastr.error('Failed to download facture PDF.', 'Erreur');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/commande']);
  }
}