import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FidelityService } from '../services/fidelity.service';
import { Fidelite } from 'src/app/models/fidelite';


@Component({
  selector: 'app-fidelity-modify',
  templateUrl: './fidelity-modify.component.html',
  styleUrls: ['./fidelity-modify.component.css']
})
export class FidelityModifyComponent implements OnInit {
  fidelity: Fidelite | null = null;
  pointsToAdd: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fidelityService: FidelityService
  ) {}

  ngOnInit(): void {
    const userId = Number(this.route.snapshot.paramMap.get('userId'));
    this.fidelityService.getFidelities().subscribe({
      next: (fidelities) => {
        this.fidelity = fidelities.find(f => f.user?.id === userId) || null;
        if (!this.fidelity) {
          this.router.navigate(['/fidelities']);
        }
      },
      error: (err) => {
        console.error('Error loading fidelity:', err);
        this.router.navigate(['/fidelities']);
      }
    });
  }

  addPoints(): void {
    if (this.fidelity && this.pointsToAdd > 0) {
      this.fidelityService.addPoints(this.fidelity.user!.id, this.pointsToAdd).subscribe({
        next: () => {
          this.fidelityService.getFidelities().subscribe({
            next: (fidelities) => {
              this.fidelity = fidelities.find(f => f.user?.id === this.fidelity!.user!.id) || null;
              this.pointsToAdd = 0;
            }
          });
        },
        error: (err) => console.error('Error adding points:', err)
      });
    }
  }
}