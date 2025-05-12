import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProduitService } from '../services/produit.service';
import { Produit } from '../models/produit.model';

@Component({
  selector: 'app-produit-create',
  templateUrl: './produit-create.component.html',
  styleUrls: ['./produit-create.component.css']
})
export class ProduitCreateComponent implements OnInit {
  produit: Produit = {
    nom: '',
    description: '',
    prix: 0,
    devise: 'DNT',
    taxe: 0,
    dateExpiration: '',
    stock: 0,
    seuilMin: 0,
    fournisseur: '',
    fournisseurId: undefined,
    autoReapprovisionnement: false,
    quantiteReapprovisionnement: 0,
    category: '',
    image: '',
    available: true
  };

  categories = ['FRUITS', 'LEGUMES', 'CEREALES', 'AUTRE'];
  selectedFile: File | null = null;
  isEditMode = false;
  productId: number | null = null;
  currentImageUrl: string | null = null;

  constructor(
    private produitService: ProduitService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.params['id'];
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    }
  }

  loadProduct(id: number): void {
    this.produitService.getById(id).subscribe({
      next: (produit) => {
        this.produit = produit;
        if (produit.image) {
          this.currentImageUrl = produit.image; // L'URL est directement dans produit.image
        }
      },
      error: (err) => {
        console.error('Error loading product:', err);
      }
    });
  }

  onFileChange(event: any): void {
    this.selectedFile = event.target.files[0];
    console.log('Selected file:', this.selectedFile?.name);
  }

  onSubmit(): void {
    if (!this.produit.nom || !this.produit.prix || !this.produit.category) {
      alert('Please fill all required fields.');
      return;
    }

    if (!this.isEditMode && !this.selectedFile) {
      alert('Please select an image for a new product.');
      return;
    }

    console.log('Submitting product:', this.produit);
    console.log('Selected file for upload:', this.selectedFile?.name);

    if (this.isEditMode && this.productId) {
      this.updateProduct(this.productId);
    } else {
      this.createProduct();
    }
  }

  private createProduct(): void {
    this.produitService.createWithImage(this.produit, this.selectedFile).subscribe({
      next: () => {
        alert('Product created successfully!');
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Error creating product:', err);
        alert('Error: ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  private updateProduct(id: number): void {
    this.produitService.updateWithImage(id, this.produit, this.selectedFile).subscribe({
      next: () => {
        alert('Product updated successfully!');
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Error updating product:', err);
        alert('Error: ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}