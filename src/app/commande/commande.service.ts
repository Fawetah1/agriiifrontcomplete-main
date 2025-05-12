import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class CommandeService {
  private apiUrl = 'http://localhost:8082/api/commandes';

  constructor(private http: HttpClient) {}

  getCommandesByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  getPendingCommandesByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}/pending`);
  }

  getCommandeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createCommande(commande: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, commande);
  }

  updateCommande(id: number, commande: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, commande);
  }

  deleteCommande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  checkoutCommande(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/checkout`, {});
  }
}