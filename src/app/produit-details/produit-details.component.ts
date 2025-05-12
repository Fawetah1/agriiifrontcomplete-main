import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitService } from '../services/produit.service';
import { Produit } from '../models/produit.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-produit-details',
  templateUrl: './produit-details.component.html',
  styleUrls: ['./produit-details.component.css']
})
export class ProduitDetailsComponent implements OnInit {
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

  goBack(): void {
    this.router.navigate(['/']);
  }
}