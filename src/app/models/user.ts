export interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    numeroDeTelephone?: string;
    role?: string;
    adresseLivraison?: string;
    dateOfBirth?: string;
  }