import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ProduitService } from '../services/produit.service';
import { RecommendationService } from '../services/recommendation.service';
import { Produit } from '../models/produit.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import Swiper, { Navigation } from 'swiper';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface ProductDisplay {
  id: number;
  name: string;
  price: number;
  devise: string;
  image: string | SafeUrl;
  quantity: number;
  stock: number;
  available: boolean;
  description?: string;
  taxe?: number;
  dateExpiration?: string;
  fournisseur?: string;
  fournisseurId?: number;
  seuilMin?: number;
  autoReapprovisionnement?: boolean;
  quantiteReapprovisionnement?: number;
  category?: string;
  salesCount?: number;
}

interface Category {
  name: string;
  image: string;
}

@Component({
  selector: 'app-homeclient',
  templateUrl: './homeclient.component.html',
  styleUrls: ['./homeclient.component.css']
})
export class HomeclientComponent implements OnInit, AfterViewInit {
  // User-related properties
  isLoggedIn: boolean = false;
  currentUser: any = {};
  showProfileMenu: boolean = false;

  // Product and recommendation properties
  products: ProductDisplay[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  recommendedProducts: ProductDisplay[] = [];
  isLoadingRecommendations = true;
  recommendationError: string | null = null;

  categories: Category[] = [
    { name: 'FRUITS', image: '/assets/template/images/fuits.jpg' },
    { name: 'LEGUMES', image: '/assets/template/images/vegetables.jpg' },
    { name: 'CEREALES', image: '/assets/template/images/grain.jpg' },
    { name: 'AUTRE', image: '/assets/template/images/others.jpg' }
  ];

  // Search properties
  searchControl = new FormControl('');
  searchResults: ProductDisplay[] = [];
  isSearching = false;
  searchLoading = false;
  searchError: string | null = null;

  private userId = 2;

  constructor(
    private produitService: ProduitService,
    private recommendationService: RecommendationService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize user authentication
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

    // Load products and recommendations
    this.loadProducts();
    this.loadRecommendedProducts();
    this.setupSearch();
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

  loadRecommendedProducts(): void {
    this.isLoadingRecommendations = true;
    this.recommendationError = null;

    this.recommendationService.getRecommendedProducts(this.userId, 6).subscribe({
      next: (produits: any[]) => {
        if (!produits || produits.length === 0) {
          this.recommendedProducts = [];
          this.recommendationError = 'Aucun produit recommandé pour le moment. Commencez à acheter pour personnaliser vos recommandations !';
        } else {
          this.recommendedProducts = produits.map(produit => ({
            id: produit.id || 0,
            name: produit.nom || 'Nom inconnu',
            price: produit.prix || 0,
            devise: produit.devise || 'MAD',
            image: produit.image && produit.image.trim() !== ''
              ? this.sanitizer.bypassSecurityTrustUrl(produit.image)
              : '/assets/img/placeholder.jpg',
            quantity: 1,
            stock: produit.stock || 0,
            available: produit.available !== undefined ? produit.available : true,
            description: produit.description,
            category: produit.category
          }));
        }
        this.isLoadingRecommendations = false;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des recommandations:', err);
        this.recommendationError = 'Erreur lors du chargement des recommandations. Veuillez réessayer plus tard.';
        this.recommendedProducts = [];
        this.isLoadingRecommendations = false;
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
            : '/assets/img/placeholder.jpg',
          quantity: 1,
          stock: produit.stock || 0,
          available: produit.available !== undefined ? produit.available : true,
          description: produit.description,
          category: produit.category
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement produits:', err);
        this.errorMessage = 'Erreur lors du chargement des produits';
        this.isLoading = false;
      }
    });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          const searchTerm = query?.trim() || '';
          this.isSearching = searchTerm.length > 0;
          this.searchLoading = this.isSearching;
          this.searchError = null;

          if (!this.isSearching) {
            this.searchResults = [];
            return of([]);
          }

          return this.produitService.searchProducts(searchTerm).pipe(
            catchError(err => {
              console.error('Search error:', err);
              this.searchError = 'Erreur lors de la recherche';
              this.searchLoading = false;
              return of([]);
            })
          );
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults = results.map((produit: any) => ({
            id: produit.id || 0,
            name: produit.nom || 'Nom inconnu',
            price: produit.prix || 0,
            devise: produit.devise || 'MAD',
            image: produit.image && produit.image.trim() !== ''
              ? this.sanitizer.bypassSecurityTrustUrl(produit.image)
              : '/assets/img/placeholder.jpg',
            quantity: 1,
            stock: produit.stock || 0,
            available: produit.available !== undefined ? produit.available : true,
            description: produit.description,
            category: produit.category
          }));
          this.searchLoading = false;
        },
        error: (err) => {
          console.error('Search subscription error:', err);
          this.searchError = 'Erreur lors de la recherche';
          this.searchLoading = false;
        }
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.isSearching = false;
    this.searchResults = [];
    this.searchError = null;
  }

  goToCategorie(categ: string): void {
    this.router.navigate(['/produitCategorieparClient'], { queryParams: { categ } });
  }

  goToProduct(productId: number): void {
    this.router.navigate(['/product-details', productId]);
    this.clearSearch();
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== '/assets/img/placeholder.jpg') {
      img.src = '/assets/img/placeholder.jpg';
    }
  }

  addToCart(product: ProductDisplay): void {
    console.log(`Ajouté ${product.name} au panier: ID=${product.id}, Quantité=${product.quantity}`);
    // Implement cart logic here
  }

  toggleWishlist(product: ProductDisplay): void {
    console.log(`Toggle wishlist pour ${product.name} (ID: ${product.id})`);
    // Implement wishlist logic here
  }

  trackByProductId(index: number, product: ProductDisplay): number {
    return product.id;
  }

  onSearchSubmit(event: Event): void {
    event.preventDefault();
    if (this.searchControl.value && this.searchControl.value.trim()) {
      this.router.navigate(['/product-list'], {
        queryParams: { search: this.searchControl.value.trim() }
      });
      this.clearSearch();
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
      window.location.reload(); // Recalculate isLoggedIn
    });
  }

  getUserPhotoUrl(user: any): string {
    return user?.photo
      ? `http://localhost:8082/uploads/${user.photo}`
      : `https://ui-avatars.com/api/?name=${user.nom}+${user.prenom}`;
  }
}