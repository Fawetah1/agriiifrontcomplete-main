import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-control-geocoder';
import { icon, Marker } from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MapsComponent implements AfterViewInit {
  private map: any;
  private markerA: L.Marker | null = null;
  private markerB: L.Marker | null = null;
  private routeControl: any;

  // Custom marker icons
  private startIcon = L.icon({
    iconUrl: 'assets/leaflet/red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  private destinationIcon = L.icon({
    iconUrl: 'assets/leaflet/green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  public distance: string | null = null;
  public duration: string | null = null;
  public carbonFootprint: string | null = null; // New property for carbon footprint
  isSidebarCollapsed: any;

  ngAfterViewInit(): void {
    // Fix Leaflet default icon path issue
    this.fixLeafletDefaultIconPath();
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (this.map) return;

    this.map = L.map('map').setView([34.0007, 9.4859], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.handleMapClick(e.latlng);
    });
  }

  /**
   * Fix Leaflet default icon issue
   * This is necessary to prevent 404 errors when Leaflet tries to load default marker icons
   */
  private fixLeafletDefaultIconPath(): void {
    // Override default icon behavior to prevent 404 errors
    const iconRetinaUrl = 'assets/leaflet/red.png';
    const iconUrl = 'assets/leaflet/red.png';
    const shadowUrl = '';
    
    // Set default icon for all markers
    Marker.prototype.options.icon = icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  }

  private handleMapClick(latlng: L.LatLng): void {
    if (!this.markerA) {
      this.markerA = L.marker(latlng, { draggable: true, icon: this.startIcon })
        .addTo(this.map)
        .bindPopup('Start')
        .openPopup();
    } else if (!this.markerB) {
      this.markerB = L.marker(latlng, { draggable: true, icon: this.destinationIcon })
        .addTo(this.map)
        .bindPopup('Destination')
        .openPopup();
      this.calculateRoute();
    } else {
      this.map.removeLayer(this.markerA);
      this.map.removeLayer(this.markerB);
      if (this.routeControl) {
        this.map.removeControl(this.routeControl);
      }
      this.markerA = null;
      this.markerB = null;
      this.distance = null;
      this.duration = null;
      this.carbonFootprint = null; // Reset carbon footprint
    }
  }

  private calculateRoute(): void {
    if (!this.markerA || !this.markerB) return;

    const start = this.markerA.getLatLng();
    const end = this.markerB.getLatLng();

    if (this.routeControl) {
      this.map.removeControl(this.routeControl);
    }

    this.routeControl = (L as any).Routing.control({
      waypoints: [start, end],
      routeWhileDragging: true,
      show: false,
      addWaypoints: false,
      createMarker: () => null,
    }).addTo(this.map);

    this.routeControl.on('routesfound', (e: any) => {
      const distanceKm = e.routes[0].summary.totalDistance / 1000; // Distance in kilometers
      const durationMin = e.routes[0].summary.totalTime / 60; // Duration in minutes
      const co2EmissionPerKm = 0.12; // 120g CO2/km for an average car
      const carbonFootprintKg = (distanceKm * co2EmissionPerKm).toFixed(2); // CO2 in kg

      this.distance = distanceKm.toFixed(2);
      this.duration = durationMin.toFixed(1);
      this.carbonFootprint = carbonFootprintKg; // Set carbon footprint
    });
  }
}