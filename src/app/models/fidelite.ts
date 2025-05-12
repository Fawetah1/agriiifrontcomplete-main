import { User } from './user';

export interface Fidelite {
  id: number;
  points: number;
  niveau: string;
  user: User | null;
}