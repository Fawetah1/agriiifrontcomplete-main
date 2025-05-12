import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface NavLink {
  path: string;
  label: string;
  icon: string;
  color: string;
  hoverColor: string;
}

@Component({
  selector: 'app-promotion-menu',
  templateUrl: './promotion-menu.component.html',
  styleUrls: ['./promotion-menu.component.css']
})
export class PromotionMenuComponent {
  navLinks: NavLink[] = [
    { path: '/promotions/list', label: 'Liste des Promotions', icon: 'fa-list', color: '#4CAF50', hoverColor: '#45a049' },
    { path: '/promotions/add', label: 'Ajouter une Promotion', icon: 'fa-plus', color: '#2196F3', hoverColor: '#1e88e5' },
    { path: '/promotions/analytics', label: 'Analyse des Promotions', icon: 'fa-chart-bar', color: '#FF9800', hoverColor: '#fb8c00' },
    {
      path: '/promotions/produits-proches-expiration',
      label: 'Promotions Automatiques',
      icon: 'fa-tags', // 🏷️ Nouvelle icône
      color: '#F44336',
      hoverColor: '#e53935'
    }
    
  ];

  bannerImageLoaded = false;
  bannerImageError = false;

  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  onImageLoad(event: Event): void {
    this.bannerImageLoaded = true;
    this.bannerImageError = false;
    console.log('Banner image loaded successfully', event);
  }

  onImageError(event: Event): void {
    this.bannerImageError = true;
    this.bannerImageLoaded = false;
    console.error('Failed to load banner image', event);
  }

  onNavClick(path: string): void {
    console.log('Navigating to:', path);
    this.router.navigate([path]).catch(err => {
      console.error('Navigation error:', err);
    });
  }
  
}