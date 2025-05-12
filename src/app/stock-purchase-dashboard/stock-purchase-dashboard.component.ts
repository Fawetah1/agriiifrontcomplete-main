import { Component, OnInit } from '@angular/core';
import { StockPurchaseService } from '../services/stock-purchase.service';
import { Produit } from '../models/produit.model';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
    selector: 'app-stock-purchase-dashboard',
    templateUrl: './stock-purchase-dashboard.component.html',
    styleUrls: ['./stock-purchase-dashboard.component.css']
})
export class StockPurchaseDashboardComponent implements OnInit {
    produits: Produit[] = [];
    topSelling: Produit[] = [];
    selectedProduit: Produit | null = null;
    quantite: number = 0;
    operation: string = 'ENTREE';
    userId: number = 1;
    selectedPurchaseProduits: Produit[] = [];
    errorMessage: string = '';
    topSellingError: string = '';
    topSellingMessage: string = '';

    public stockChartData: ChartConfiguration<'line'>['data'] = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Stock des produits',
                fill: false,
                borderColor: '#3b82f6',
                tension: 0.4
            }
        ]
    };
    public stockChartOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: { display: true },
            title: { display: true, text: 'Évolution du stock' }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Stock (unités)' }
            },
            x: {
                title: { display: true, text: 'Produits' }
            }
        }
    };

    public salesChartData: ChartConfiguration<'bar'>['data'] = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Ventes',
                backgroundColor: '#10b981',
                borderColor: '#059669',
                borderWidth: 1
            }
        ]
    };
    public salesChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            legend: { display: true },
            title: { display: true, text: 'Produits les plus vendus' }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Nombre de ventes' }
            },
            x: {
                title: { display: true, text: 'Produits' }
            }
        }
    };

    constructor(private stockPurchaseService: StockPurchaseService) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
      this.stockPurchaseService.getProduits().subscribe({
          next: (produits) => {
              console.log('Produits chargés:', produits); // Log pour déboguer
              this.produits = produits;
              this.updateStockChart();
          },
          error: (error) => {
              this.errorMessage = 'Erreur lors du chargement des produits: ' + error.message;
              console.error('Erreur de chargement des produits:', error.message);
          }
      });
      this.stockPurchaseService.getTopSellingProducts(5).subscribe({
          next: (topSelling) => {
              console.log('Produits les plus vendus:', topSelling); // Log pour déboguer
              this.topSelling = topSelling;
              this.updateSalesChart();
              if (topSelling.length === 0) {
                  this.topSellingMessage = 'Aucun produit vendu pour le moment.';
              } else if (topSelling.every(produit => produit.salesCount === 0)) {
                  this.topSellingMessage = 'Aucun produit n\'a encore été vendu.';
              } else {
                  this.topSellingMessage = '';
              }
          },
          error: (error) => {
              this.topSellingError = 'Erreur lors de la récupération des produits les plus vendus: ' + error.message;
              console.error('Erreur de chargement des produits les plus vendus:', error.message);
          }
      });
  }

    updateStockChart(): void {
        this.stockChartData.labels = this.produits.map(produit => produit.nom);
        this.stockChartData.datasets[0].data = this.produits.map(produit => produit.stock);
    }

    updateSalesChart(): void {
        this.salesChartData.labels = this.topSelling.map(produit => produit.nom);
        this.salesChartData.datasets[0].data = this.topSelling.map(produit => produit.salesCount || 0);
    }

    handleStockOperation(): void {
        if (!this.selectedProduit || !this.selectedProduit.id || this.quantite <= 0) {
            this.errorMessage = 'Veuillez sélectionner un produit valide et entrer une quantité positive';
            return;
        }

        const operation$ = this.operation === 'ENTREE'
            ? this.stockPurchaseService.enregistrerEntree(this.selectedProduit.id, this.quantite)
            : this.stockPurchaseService.enregistrerPerte(this.selectedProduit.id, this.quantite);

        operation$.subscribe({
            next: () => {
                this.loadData();
                this.quantite = 0;
                this.selectedProduit = null;
                this.errorMessage = 'Opération enregistrée avec succès';
            },
            error: (error) => {
                this.errorMessage = `Erreur lors de l'enregistrement de l'opération: ${error.message}`;
            }
        });
    }

    handlePurchase(): void {
        if (this.selectedPurchaseProduits.length === 0 || this.selectedPurchaseProduits.some(p => !p.id)) {
            this.errorMessage = 'Veuillez sélectionner au moins un produit valide pour l\'achat';
            return;
        }

        this.stockPurchaseService.createPurchase(this.userId, this.selectedPurchaseProduits.map(p => p.id!)).subscribe({
            next: (message) => {
                this.loadData();
                this.selectedPurchaseProduits = [];
                this.errorMessage = message || 'Achat enregistré avec succès';
            },
            error: (error) => {
                this.errorMessage = `Erreur lors de l'enregistrement de l'achat: ${error.message}`;
            }
        });
    }

    toggleProduitSelection(produit: Produit): void {
      console.log('Toggle produit:', produit.nom, 'Actuellement sélectionné:', this.selectedPurchaseProduits.includes(produit));
      if (this.selectedPurchaseProduits.includes(produit)) {
          this.selectedPurchaseProduits = this.selectedPurchaseProduits.filter(p => p.id !== produit.id);
      } else {
          this.selectedPurchaseProduits.push(produit);
      }
      console.log('Produits sélectionnés après toggle:', this.selectedPurchaseProduits.map(p => p.nom));
  }
    }
