import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

// Extend the RoutingControl interface to include the 'on' method and other methods
interface RoutingControl extends L.Control {
  setWaypoints(waypoints: L.LatLng[]): void;
  getWaypoints(): L.LatLng[];
  spliceWaypoints(index: number, toRemove: number, ...waypoints: L.LatLng[]): L.LatLng[];
  on(event: string, callback: (e: any) => void): void; // Add the 'on' method for event handling
}

@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class HistoriqueComponent implements OnInit, OnDestroy {
  userId: number | null = null;
  user: any = {
    prenom: 'John',
    nom: 'Doe',
  };
  history: any[] = [];
  filteredHistory: any[] = [];
  searchTerm: string = '';
  filters: any = {
    status: '',
    type: '',
    startDate: null,
    endDate: null,
  };
  activeFilters: { key: string; value: string }[] = [];
  isSidebarCollapsed = false;
  isLoading = false;
  error: string | null = null;
  selectedEntry: any = null;
  showDetailsModal = false;
  manualLocation: string = '';
  useManualLocation = false;
  distance: string | null = null;
  duration: string | null = null;
    public carbonFootprint: string | null = null; 


  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private map: L.Map | null = null;
  private routingControl: RoutingControl | null = null;

  // Custom marker icons
  private startIcon = L.icon({
    iconUrl: 'assets/leaflet/green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  private destinationIcon = L.icon({
    iconUrl: 'assets/leaflet/red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  private statusDisplayMap: { [key: string]: string } = {
    delivered: 'Delivered',
    in_progress: 'In Progress',
    cancelled: 'Cancelled',
    unknown: 'Unknown',
  };

  private typeDisplayMap: { [key: string]: string } = {
    a_domicile: 'a_domicile',
    point_relais: 'point_relais',
    unknown: 'Unknown',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('userId');
      this.userId = id ? +id : null;
      this.loadUser();
      this.loadHistory();
    });

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.searchTerm = term;
        this.applyFilters();
      });
  }

  ngOnDestroy() {
    this.cleanupMap();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      if (user.id === this.userId) {
        this.user = { prenom: user.prenom, nom: user.nom };
      } else {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadHistory() {
    this.isLoading = true;
    this.error = null;

    this.http.get<any[]>('http://localhost:8082/api/livraisons/all').subscribe({
      next: (response) => {
        this.history = response.map(entry => ({
          id: entry.id,
          date: new Date(entry.updatedAt || entry.createdAt),
          status: this.mapStatus(entry.statusLivraison?.toLowerCase()),
          type: entry.typeLivraison?.toLowerCase() || 'unknown',
          photo: entry.photo,
          reason: entry.reason,
          livreur: entry.livreur,
          address: entry.address || 'Unknown Address',
        }));
        this.filteredHistory = [...this.history];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.error = 'Failed to load delivery history. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private mapStatus(status: string): string {
    switch (status) {
      case 'livre':
        return 'delivered';
      case 'en_cours':
        return 'in_progress';
      case 'non_livre':
        return 'cancelled';
      default:
        return 'unknown';
    }
  }

  onSearchChange(term: string) {
    this.searchSubject.next(term);
  }

  applyFilters() {
    this.filteredHistory = this.history.filter(entry => {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchTermLower ||
        entry.id.toString().toLowerCase().includes(searchTermLower) ||
        (entry.address && entry.address.toLowerCase().includes(searchTermLower)) ||
        (entry.livreur?.nom && entry.livreur.nom.toLowerCase().includes(searchTermLower)) ||
        entry.status.toLowerCase().includes(searchTermLower) ||
        entry.type.toLowerCase().includes(searchTermLower);

      const matchesStatus = !this.filters.status || entry.status === this.filters.status;
      const matchesType = !this.filters.type || entry.type === this.filters.type;

      const entryDate = new Date(entry.date);
      const startDate = this.filters.startDate
        ? new Date(new Date(this.filters.startDate).setHours(0, 0, 0, 0))
        : null;
      const endDate = this.filters.endDate
        ? new Date(new Date(this.filters.endDate).setHours(23, 59, 59, 999))
        : null;

      const matchesStartDate = !startDate || entryDate >= startDate;
      const matchesEndDate = !endDate || entryDate <= endDate;

      return matchesSearch && matchesStatus && matchesType && matchesStartDate && matchesEndDate;
    });

    this.updateActiveFilters();
  }

  updateActiveFilters() {
    this.activeFilters = [];
    if (this.filters.status) {
      this.activeFilters.push({
        key: 'status',
        value: `Status: ${this.statusDisplayMap[this.filters.status] || this.filters.status}`,
      });
    }
    if (this.filters.type) {
      this.activeFilters.push({
        key: 'type',
        value: `Type: ${this.typeDisplayMap[this.filters.type] || this.filters.type}`,
      });
    }
    if (this.filters.startDate) {
      this.activeFilters.push({
        key: 'startDate',
        value: `Start Date: ${new Date(this.filters.startDate).toLocaleDateString()}`,
      });
    }
    if (this.filters.endDate) {
      this.activeFilters.push({
        key: 'endDate',
        value: `End Date: ${new Date(this.filters.endDate).toLocaleDateString()}`,
      });
    }
    if (this.searchTerm.trim()) {
      this.activeFilters.push({
        key: 'search',
        value: `Search: ${this.searchTerm}`,
      });
    }
  }

  removeFilter(key: string) {
    if (key === 'search') {
      this.searchTerm = '';
      this.searchSubject.next('');
    } else {
      this.filters[key] = key === 'status' || key === 'type' ? '' : null;
    }
    this.applyFilters();
  }

  resetFilters() {
    this.filters = {
      status: '',
      type: '',
      startDate: null,
      endDate: null,
    };
    this.searchTerm = '';
    this.searchSubject.next('');
    this.filteredHistory = [...this.history];
    this.activeFilters = [];
  }

  goBack() {
    if (this.userId) {
      this.router.navigate(['/profile', this.userId]);
    } else {
      this.router.navigate(['/login']);
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  private cleanupMap() {
    if (this.routingControl && this.map) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.distance = null;
    this.duration = null;
  }

  private async geocodeAddress(address: string): Promise<L.LatLng> {
    return new Promise((resolve, reject) => {
      this.http
        .get<any>(`https://nominatim.openstreetmap.org/search`, {
          params: {
            q: address,
            format: 'json',
            limit: '1',
            // Adding email instead of User-Agent as recommended by Nominatim usage policy
            email: 'contact@example.com'
          }
          // Removed the User-Agent header as browsers block it
        })
        .subscribe({
          next: (response) => {
            if (response && response.length > 0) {
              const result = response[0];
              console.log(`Geocoded address "${address}": Lat ${result.lat}, Lon ${result.lon}`);
              resolve(L.latLng(parseFloat(result.lat), parseFloat(result.lon)));
            } else {
              console.warn(`Geocoding failed for address "${address}". Using fallback.`);
              resolve(L.latLng(36.8065, 10.1815)); // Fallback to Tunis
            }
          },
          error: (err) => {
            console.error('Geocoding error:', err);
            resolve(L.latLng(36.8065, 10.1815)); // Fallback to Tunis
          },
        });
    });
  }

  private async initMap() {
    this.cleanupMap();

    // Fix for missing default marker icons
    // Override default icon to use our custom icons instead
    L.Marker.prototype.options.icon = this.startIcon;
    
    // Delete default icon references to prevent 404 errors
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    // Configure Leaflet to use our icons
    L.Icon.Default.mergeOptions({
      iconUrl: 'assets/leaflet/green.png',
      iconRetinaUrl: 'assets/leaflet/green.png',
      shadowUrl: '',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    setTimeout(() => {
      const mapElement = document.getElementById('details-map');
      if (mapElement && !this.map) {
        const defaultCoords = L.latLng(36.8065, 10.1815); // Default: Tunis
        const defaultZoom = 13;

        this.map = L.map('details-map').setView(defaultCoords, defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(this.map);

        setTimeout(() => {
          this.map?.invalidateSize();
        }, 100);
      }
    }, 100);
  }

  private async addRoute(start: L.LatLng, end: L.LatLng) {
    if (this.routingControl && this.map) {
      this.map.removeControl(this.routingControl);
    }
    
    // Set a timeout for the routing request
    let routingTimeout: any;
    const timeoutPromise = new Promise<void>((_, reject) => {
      routingTimeout = setTimeout(() => {
        reject(new Error('Routing request timed out'));
      }, 5000); // 5 second timeout
    });

    try {
      // No longer calculate distance in frontend, will use backend for all calculations
      
      this.routingControl = (L as any).Routing.control({
        waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }) as RoutingControl; // Cast to RoutingControl

      if (this.map) {
        this.routingControl.addTo(this.map);
      }
      
      // No longer drawing fallback blue line
    } catch (error) {
      console.warn('Error initializing routing control:', error);
      // Fallback already calculated
    }

    // Add event listener to calculate distance and duration with null check
    if (this.routingControl) {
      // Handle successful route calculation
      this.routingControl.on('routesfound', (e: any) => {
        const distanceKm = e.routes[0].summary.totalDistance / 1000; // Distance in kilometers
        const durationMin = e.routes[0].summary.totalTime / 60; // Duration in minutes
        
        // Get distance and duration from the OSRM routing
        this.distance = distanceKm.toFixed(2);
        this.duration = durationMin.toFixed(1);
        
        // Get delivery details including carbon footprint from backend
        this.fetchDeliveryDetails(this.selectedEntry?.id, distanceKm);
      });
      
      // Handle routing errors
      this.routingControl.on('routingerror', (e: any) => {
        console.warn('Routing error: ', e);
        // Fallback calculations already done
      });
    }
    

    // Add markers with custom icons
    if (this.map) {
      L.marker(start, { icon: this.startIcon })
        .addTo(this.map)
        .bindPopup('Your Location (PC)')
        .openPopup();

      L.marker(end, { icon: this.destinationIcon })
        .addTo(this.map)
        .bindPopup('Delivery Location')
        .openPopup();

      setTimeout(() => {
        this.map?.fitBounds(L.latLngBounds([start, end]), {
          padding: [50, 50],
        });
      }, 100);
    }
  }

  private getCurrentLocation(): Promise<L.LatLng> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            console.log(`Geolocation retrieved: Lat ${lat}, Lon ${lng}, Accuracy ${accuracy} meters`);
            resolve(L.latLng(lat, lng));
          },
          (error) => {
            console.error('Geolocation error:', error.message);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      } else {
        const error = new Error('Geolocation is not supported by this browser.');
        console.error(error.message);
        reject(error);
      }
    });
  }

  async viewDetails(entry: any): Promise<void> {
    this.selectedEntry = entry;
    this.showDetailsModal = true;
    this.useManualLocation = false;
    this.manualLocation = '';
    this.distance = null;
    this.duration = null;

    setTimeout(async () => {
      const address = entry.address || 'Tunis, Tunisia';
      await this.initMap();

      const end = await this.geocodeAddress(address);

      if (this.useManualLocation && this.manualLocation) {
        try {
          const start = await this.geocodeAddress(this.manualLocation);
          await this.addRoute(start, end);
        } catch (error) {
          console.error('Error geocoding manual location:', error);
          const fallbackStart = L.latLng(36.8065, 10.1815); // Fallback: Tunis
          await this.addRoute(fallbackStart, end);
        }
      } else {
        try {
          const start = await this.getCurrentLocation();
          await this.addRoute(start, end);
        } catch (error) {
          console.error('Error getting current location:', error);
          const fallbackStart = L.latLng(36.8065, 10.1815); // Fallback: Tunis
          await this.addRoute(fallbackStart, end);
        }
      }
    }, 200);
  }

  async setManualLocation() {
    if (this.manualLocation) {
      this.useManualLocation = true;
      const address = this.selectedEntry.address || 'Tunis, Tunisia';
      await this.initMap();
      const end = await this.geocodeAddress(address);
      try {
        const start = await this.geocodeAddress(this.manualLocation);
        await this.addRoute(start, end);
      } catch (error) {
        console.error('Error geocoding manual location:', error);
        const fallbackStart = L.latLng(36.8065, 10.1815); // Fallback: Tunis
        await this.addRoute(fallbackStart, end);
      }
    }
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedEntry = null;
    this.useManualLocation = false;
    this.manualLocation = '';
    this.cleanupMap();
  }

  /**
   * Fetch delivery details from backend including carbon footprint
   * All calculations are done on the backend side
   */
  private fetchDeliveryDetails(deliveryId: number | undefined, distanceKm?: number) {
    if (!deliveryId) {
      console.warn('No delivery ID provided for fetching details');
      this.carbonFootprint = '?';
      return;
    }

    // Get delivery details from backend
    this.http.get<any>(`http://localhost:8082/api/livraisons/${deliveryId}`).subscribe({
      next: (delivery) => {
        if (delivery && delivery.carbonFootprint) {
          // Use the backend-calculated carbon footprint
          this.carbonFootprint = delivery.carbonFootprint.toFixed(2);
        } else {
          // If no carbon footprint in delivery, try to calculate it
          const apiUrl = 'http://localhost:8082/api/livraisons/carbon-footprint';
          
          this.http.post<any>(apiUrl, {
            vehicleType: 'VOITURE', // Always use car (consistent with backend)
            distance: distanceKm || 0,
            livraisonId: deliveryId
          }).subscribe({
            next: (result) => {
              if (result && result.carbonFootprint) {
                this.carbonFootprint = result.carbonFootprint.toFixed(2);
              } else {
                this.carbonFootprint = '?';
              }
            },
            error: () => {
              this.carbonFootprint = '?';
            }
          });
        }
      },
      error: (err) => {
        console.error('Error fetching delivery details:', err);
        this.carbonFootprint = '?';
      }
    });
  }
}