import { SafeUrl } from "@angular/platform-browser";

export interface Produit {
  id?: number;
  nom: string;
  description?: string;
  prix: number;
  devise?: string;
  taxe?: number;
  dateExpiration?: string;
  fournisseur?: string;
  fournisseurId?: number;
  image?: string ;
  stock: number;
  seuilMin?: number;
  autoReapprovisionnement?: boolean;
  quantiteReapprovisionnement?: number;
  category?: string;
  available: boolean;
  salesCount?: number;
  quantity?: number;

}