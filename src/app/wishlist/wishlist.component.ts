import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

interface Produit {
  id?: number;
  nom: string;
  image?: string;
  description: string;
  prix: number;
  stock: number;
  user: any;
}

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  wishlist: Produit[] = [];

  constructor(private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadWishlistFromStorage();
  }

  loadWishlistFromStorage(): void {
    const storedWishlist = localStorage.getItem('wishlist');
    if (storedWishlist) {
      this.wishlist = JSON.parse(storedWishlist);
    }
  }

  removeFromWishlist(product: Produit): void {
    this.wishlist = this.wishlist.filter(item => item.id !== product.id);
    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    this.toastr.info(`${product.nom} removed from wishlist`, 'Info');
  }
}