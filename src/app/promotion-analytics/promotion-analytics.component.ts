import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { PromotionService, AnalyticsSummary } from '../services/promotion.service';
import { CountUp } from 'countup.js';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-promotion-analytics',
  templateUrl: './promotion-analytics.component.html',
  styleUrls: ['./promotion-analytics.component.css']
})
export class PromotionAnalyticsComponent implements OnInit, AfterViewChecked {
  isLoading = true;
  errorMessage: string | null = null;

  totalPromotions = 0;
  activePromotions = 0;
  expiredPromotions = 0;
  totalPromotionsApplied = 0;
  isChartDataEmpty = true;

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre d\'applications'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Promotions'
        }
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  };

  private countersAnimated = false;

  constructor(private promotionService: PromotionService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngAfterViewChecked(): void {
    if (!this.countersAnimated && !this.isLoading && !this.errorMessage) {
      this.animateCounters();
      this.countersAnimated = true;
    }
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.countersAnimated = false;

    this.promotionService.getAnalytics().subscribe({
      next: (data: AnalyticsSummary) => {
        console.log('Données reçues :', data); // Log des données pour vérification

        this.totalPromotions = data.totalPromotions;
        this.activePromotions = data.activePromotions;
        this.expiredPromotions = data.expiredPromotions;
        this.totalPromotionsApplied = data.totalPromotionsApplied;

        this.barChartData = {
          labels: data.chartData.labels,
          datasets: data.chartData.datasets
        };

        console.log('barChartData :', this.barChartData); // Log de barChartData

        this.isChartDataEmpty = !data.chartData.labels.length || !data.chartData.datasets.length;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Une erreur est survenue lors du chargement des données.';
        this.isLoading = false;
      }
    });
  }

  animateCounters(): void {
    const options = { duration: 2 };

    new CountUp('totalPromotions', this.totalPromotions, options).start();
    new CountUp('activePromotions', this.activePromotions, options).start();
    new CountUp('expiredPromotions', this.expiredPromotions, options).start();
    new CountUp('totalApplied', this.totalPromotionsApplied, options).start();
  }
}