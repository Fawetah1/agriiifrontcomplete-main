import { Component } from '@angular/core';
import { Produit } from '../models/produit.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ProduitService } from '../services/produit.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-produit-details-client',
  templateUrl: './produit-details-client.component.html',
  styleUrls: ['./produit-details-client.component.css']
})
export class ProduitDetailsClientComponent {
produit: Produit | null = null;
  imageUrl: SafeUrl | string = '/assets/img/placeholder.jpg';

  constructor(
    private route: ActivatedRoute,
    private produitService: ProduitService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadProduct(id);
    }
  }

  loadProduct(id: number): void {
    this.produitService.getById(id).subscribe({
      next: (produit) => {
        this.produit = produit;
        this.imageUrl = produit.image && produit.image.trim() !== ''
          ? produit.image
          : '/assets/img/placeholder.jpg';
      },
      error: (err) => {
        console.error('Error loading product:', err);
      }
    });
  }
  

  editProduct(): void {
    if (this.produit?.id) {
      this.router.navigate(['/produit-create', this.produit.id]);
    }
  }

  deleteProduct(): void {
    if (this.produit?.id && confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      this.produitService.delete(this.produit.id).subscribe({
        next: () => {
          alert('Produit supprimé avec succès');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          alert('Erreur lors de la suppression du produit');
        }
      });
    }
  }
  acheterProduit() {
    console.log('Produit acheté:', this.produit?.nom);
    // Ici tu peux ajouter ta logique d'achat
  }
  
  goBack(): void {
    this.router.navigate(['homeclient']);
  }
}
