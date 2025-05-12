import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProduitService } from '../services/produit.service';
import { Produit } from '../models/produit.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import Swiper, { Navigation } from 'swiper';

interface ProductDisplay {
  id: number;
  name: string;
  price: number;
  devise: string;
  image: string | SafeUrl;
}

interface Category {
  name: string;
  image: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  isLoggedIn: boolean = false;
  currentUser: any = {};
  showProfileMenu: boolean = false;
  products: ProductDisplay[] = [];
  categories: Category[] = [
    { name: 'FRUITS', image: '/assets/template/images/fuits.jpg' },
    { name: 'LEGUMES', image: '/assets/template/images/vegetables.jpg' },
    { name: 'CEREALES', image: '/assets/template/images/grain.jpg' },
    { name: 'AUTRE', image: '/assets/template/images/others.jpg' }
  ];

  constructor(
    private router: Router,
    private produitService: ProduitService,
    private sanitizer: DomSanitizer
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

    this.loadProducts();
  }

  ngAfterViewInit(): void {
    new Swiper('.category-carousel', {
      modules: [Navigation],
      slidesPerView: 4,
      spaceBetween: 20,
      navigation: {
        nextEl: '.category-carousel-next',
        prevEl: '.category-carousel-prev',
      },
      breakpoints: {
        320: { slidesPerView: 1 },
        576: { slidesPerView: 2 },
        768: { slidesPerView: 3 },
        992: { slidesPerView: 4 }
      }
    });
  }

  loadProducts(): void {
    this.produitService.getAll().subscribe({
      next: (response: any) => {
        const produits = response.content || response;
        this.products = produits.map((produit: Produit) => ({
          id: produit.id!,
          name: produit.nom,
          price: produit.prix,
          devise: produit.devise || 'XAF',
          image: produit.image && produit.image.trim() !== ''
            ? this.sanitizer.bypassSecurityTrustUrl(produit.image)
            : '/assets/img/placeholder.jpg'
        }));
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }
  

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== '/assets/img/placeholder.jpg') {
      img.src = '/assets/img/placeholder.jpg';
    }
  }

  editProduct(productId: number): void {
    this.router.navigate(['/produit-create', productId]);
  }

  deleteProduct(productId: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.produitService.delete(productId).subscribe({
        next: () => {
          this.products = this.products.filter(product => product.id !== productId);
          alert('Product deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          alert('Error deleting product');
        }
      });
    }
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  onGoToMyAccount(): void {
    this.router.navigate(['/my-account']);
  }

  onLogout(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/home']).then(() => {
      window.location.reload(); // Recalcule isLoggedIn
    });
  }

  getUserPhotoUrl(user: any): string {
    return user?.photo
      ? `http://localhost:8082/uploads/${user.photo}`
      : `https://ui-avatars.com/api/?name=${user.nom}+${user.prenom}`;
  }
}