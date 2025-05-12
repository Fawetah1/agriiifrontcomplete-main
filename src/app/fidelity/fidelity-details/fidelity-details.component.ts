import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FidelityService } from '../services/fidelity.service';
import { Fidelite } from 'src/app/models/fidelite';


@Component({
  selector: 'app-fidelity-details',
  templateUrl: './fidelity-details.component.html',
  styleUrls: ['./fidelity-details.component.css']
})
export class FidelityDetailsComponent implements OnInit {
  fidelity: Fidelite | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fidelityService: FidelityService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.fidelityService.getFidelityById(id).subscribe({
      next: (data) => this.fidelity = data,
      error: (err) => {
        console.error('Error loading fidelity:', err);
        this.router.navigate(['/fidelities']);
      }
    });
  }

  confirmDelete(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce programme de fidélité ?')) {
      this.fidelityService.deleteFidelity(id).subscribe({
        next: () => this.router.navigate(['/fidelities']),
        error: (err) => console.error('Error deleting fidelity:', err)
      });
    }
  }
}