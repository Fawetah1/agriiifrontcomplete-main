import { Fidelite } from './fidelite';

export interface PointHistory {
  id: number;
  fidelite: Fidelite | null;
  points: number;
  description: string;
  date: string;
  points_added: number;
}