import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FidelityService } from '../services/fidelity.service';
import { PointHistory } from 'src/app/models/point-history';


@Component({
  selector: 'app-point-history',
  templateUrl: './point-history.component.html',
  styleUrls: ['./point-history.component.css']
})
export class PointHistoryComponent implements OnInit {
  pointHistory: PointHistory[] = [];

  constructor(
    private route: ActivatedRoute,
    private fidelityService: FidelityService
  ) {}

  ngOnInit(): void {
    const userId = Number(this.route.snapshot.paramMap.get('userId'));
    this.fidelityService.getPointHistory(userId).subscribe({
      next: (data) => this.pointHistory = data,
      error: (err) => console.error('Error loading point history:', err)
    });
  }
}