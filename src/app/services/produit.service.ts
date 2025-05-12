import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Produit } from '../models/produit.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ProduitService {
  private baseUrl = 'http://localhost:8082/api/produits';
  private productsSubject = new BehaviorSubject<Produit[]>([]);
  products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Produit[]> {
    return this.http.get<Produit[]>(this.baseUrl);
  }

  setProducts(products: Produit[]): void {
    this.productsSubject.next(products);
  }

  getCachedProducts(): Produit[] {
    return this.productsSubject.getValue();
  }

  getById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.baseUrl}/${id}`);
  }

  getByCategory(category: string, page: number = 0, pageSize: number = 10, sortBy: string = 'id'): Observable<Page<Produit>> {
    let params = new HttpParams()
      .set('category', category.toUpperCase())
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy);
    return this.http.get<Page<Produit>>(`${this.baseUrl}/categorie`, { params });
  }

  searchProducts(query: string): Observable<Produit[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<Produit[]>(`${this.baseUrl}/search`, { params })
      .pipe(
        catchError(error => {
          console.error('Erreur de recherche:', error);
          return of([]);
        })
      );
  }

  create(produit: Produit): Observable<Produit> {
    return this.http.post<Produit>(this.baseUrl, produit);
  }

  createWithImage(produit: Produit, imageFile: File | null): Observable<Produit> {
    const formData = new FormData();
    formData.append('produit', new Blob([JSON.stringify(produit)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }
    return this.http.post<Produit>(`${this.baseUrl}/upload`, formData, {
      reportProgress: true
    });
  }

  update(id: number, produit: Produit): Observable<Produit> {
    return this.http.put<Produit>(`${this.baseUrl}/${id}`, produit);
  }

  updateWithImage(id: number, produit: Produit, imageFile: File | null): Observable<Produit> {
    const formData = new FormData();
    formData.append('produit', new Blob([JSON.stringify(produit)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }
    return this.http.put<Produit>(`${this.baseUrl}/upload/${id}`, formData, {
      reportProgress: true
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}