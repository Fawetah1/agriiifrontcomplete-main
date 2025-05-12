import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  stats: any;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getUserStats().subscribe(data => {
      this.stats = data;
    });
  }
  total(): number {
    return (this.stats?.total || 0) + (this.stats?.blocked || 0) + (this.stats?.admins || 0) + (this.stats?.clients || 0);
  }

  totalPercentage(value: number): number {
    const t = this.total();
    return t ? (value / t) * 100 : 0;
  }

  blockedPercentage(value: number): number {
    return this.totalPercentage((this.stats?.total || 0) + value);
  }

  adminPercentage(value: number): number {
    return this.totalPercentage((this.stats?.total || 0) + (this.stats?.blocked || 0) + value);
  }
  getBarPercentage(value: number): number {
    const total = (this.stats?.total || 0) + (this.stats?.blocked || 0) + (this.stats?.admins || 0) + (this.stats?.clients || 0);
    return total ? (value / total) * 100 : 0;
  }
}
