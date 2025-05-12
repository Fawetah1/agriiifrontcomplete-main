import { Component, ElementRef, ViewChild, OnInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LivraisonService, Commande, Livraison } from './livraison.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-livraison',
  templateUrl: './livraison.component.html',
  styleUrls: ['./livraison.component.css'],
})
export class LivraisonComponent implements OnInit {
  currentOrderId: number | null = null;
  stream: MediaStream | null = null;
  isSidebarCollapsed = false;
  isCameraActive = false;
  isReasonInputActive = false;
  driverName: string = 'Driver';
  userId: number | null = null;
  hidingOrders: Set<number> = new Set();
  private orderTimers: Map<number, number> = new Map();
  private timerIntervals: Map<number, any> = new Map();
  
  // Carbon footprint calculator properties
  // Always using VOITURE (car) as the vehicle type
  carbonCalc = {
    vehicleType: 'VOITURE', // Fixed to car type as requested
    adresse: '',
    distance: 10,
    currentPosition: null as {lat: number, lng: number} | null,
    destinationPosition: null as {lat: number, lng: number} | null,
    isGettingLocation: false,
    locationError: null as string | null,
    result: null as { carbonFootprint: number, distance: number, emissionFactor: number } | null
  };

  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('reasonInput') reasonInputElement!: ElementRef<HTMLTextAreaElement>;
  
  // Store captured photo data
  capturedPhoto: string | undefined;

  commandes: Livraison[] = [];
  pendingCommandes: Livraison[] = [];

  // Add a mapping between commandes and livraison IDs
  private livraisonIdMap: { [commandeId: number]: number } = {};

  constructor(
    @Inject(LivraisonService) private livraisonService: LivraisonService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('userId');
      this.userId = id ? +id : null;
      this.loadDriverInfo();
      this.loadCommandes();
    });
  }

  loadDriverInfo() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        this.driverName = user.prenom || user.nom || 'Driver';
        this.userId = user.id || null;
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.driverName = 'Driver';
      }
    }
  }

  loadCommandes() {
    console.log('Loading commandes from API...');
    // Load all commandes from the API
    this.livraisonService.getAllCommandes().subscribe({
      next: (data: any[]) => {
        console.log('Commandes loaded:', data);
        
        // Load stored livraison assignments from localStorage
        const storedAssignments = this.loadStoredCommandeAssignments();
        
        // Load stored livraison ID mappings
        this.livraisonIdMap = this.loadLivraisonIdMappings();
        console.log('Loaded livraison ID mappings:', this.livraisonIdMap);
        
        this.commandes = data
          .filter((commande): commande is Commande => !!commande && typeof commande.id === 'number')
          .map(commande => {
            // Check if this commande has a stored assignment
            const storedLivreur = commande.id ? storedAssignments[commande.id] : null;
            
            return {
              id: commande.id,
              statusLivraison: commande.status === 'PENDING' ? 'TAKE_IT' : commande.status || 'TAKE_IT',
              typeLivraison: 'A_DOMICILE',
              // Use stored livreur data if available, otherwise use data from API response
              livreur: storedLivreur || commande.livreur || {
                id: 0,
                nom: '',
                email: '',
                telephone: '',
                userId: 0
              },
              commandeId: commande.id,
              clientNom: commande.clientNom || 'Unknown Client',
              adresse: commande.adresse || 'Unknown adresse',
              telephone: commande.telephone || 'Unknown Telephone',
              // Mark as taken if it has stored livreur data or API indicates it's in progress
              isTaken: commande.status === 'EN_COURS' || !!commande.livreur?.nom || !!storedLivreur?.nom,
              photo: undefined,
              reason: undefined
            };
          });
        
        // Process the commandes without relying on a separate livraisons endpoint
        this.processPendingCommandes();
      },
      error: (error: { message: any; }) => {
        console.error('Error loading commandes:', error.message);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: `Erreur lors du chargement des commandes: ${error.message}`,
        });
        this.commandes = [];
        this.pendingCommandes = [];
      }
    });
  }

  // Helper method to process pending commandes
  private processPendingCommandes() {
    this.pendingCommandes = this.commandes.filter(commande => 
      (commande.statusLivraison === 'TAKE_IT' || commande.statusLivraison === 'EN_COURS') && 
      !this.hidingOrders.has(commande.id!)
    );
    
    this.pendingCommandes = [...this.pendingCommandes];
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  /**
   * Get the current GPS position
   */
  getCurrentGPSPosition(): Promise<{lat: number, lng: number}> {
    return new Promise((resolve, reject) => {
      this.carbonCalc.isGettingLocation = true;
      this.carbonCalc.locationError = null;
      
      if (!navigator.geolocation) {
        this.carbonCalc.locationError = 'La géolocalisation n\'est pas supportée par votre navigateur';
        this.carbonCalc.isGettingLocation = false;
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.carbonCalc.currentPosition = coords;
          this.carbonCalc.isGettingLocation = false;
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Erreur de géolocalisation';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'L\'accès à la position a été refusé';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'La position n\'est pas disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'La demande de géolocalisation a expiré';
              break;
          }
          this.carbonCalc.locationError = errorMessage;
          this.carbonCalc.isGettingLocation = false;
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
  
  /**
   * Geocode an adresse to get coordinates
   */
  async geocodeadresseForCarbon(adresse: string): Promise<{lat: number, lng: number} | null> {
    if (!adresse.trim()) {
      return null;
    }
    
    try {
      // Call Nominatim for geocoding
      const response = await this.http.get<any[]>('https://nominatim.openstreetmap.org/search', {
        params: {
          q: adresse,
          format: 'json',
          limit: '1',
          email: 'contact@example.com'
        }
      }).toPromise();
      
      if (response && response.length > 0) {
        const result = response[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding adresse:', error);
      return null;
    }
  }
  
  /**
   * Calculate carbon footprint based on the entered values
   * Always uses VOITURE (car) as the vehicle type
   */
  async calculateCarbonFootprint() {
    // Always use car as the vehicle type, regardless of selection
    this.carbonCalc.vehicleType = 'VOITURE';
    
    // Try to get current position if not already available
    if (!this.carbonCalc.currentPosition) {
      try {
        await this.getCurrentGPSPosition();
      } catch (error) {
        console.error('Failed to get GPS position:', error);
        // Continue with calculation even if GPS fails
      }
    }
    
    // Try to geocode the adresse
    if (this.carbonCalc.adresse && !this.carbonCalc.destinationPosition) {
      try {
        const coords = await this.geocodeadresseForCarbon(this.carbonCalc.adresse);
        if (coords) {
          this.carbonCalc.destinationPosition = coords;
        }
      } catch (error) {
        console.error('Failed to geocode adresse:', error);
      }
    }
    
    // Validate distance
    if (!this.carbonCalc.distance || this.carbonCalc.distance < 0) {
      this.carbonCalc.distance = 10; // Default to 10km if invalid
    }
    
    // Call the API to calculate carbon footprint
    this.livraisonService.calculateCarbonFootprint(
      this.carbonCalc.vehicleType, 
      this.carbonCalc.adresse,
      this.carbonCalc.currentPosition?.lat,
      this.carbonCalc.currentPosition?.lng,
      this.carbonCalc.destinationPosition?.lat,
      this.carbonCalc.destinationPosition?.lng,
      this.carbonCalc.distance
    ).subscribe({
      next: (result: { carbonFootprint: number; distance: number; emissionFactor: number; } | null) => {
        console.log('Carbon footprint calculation successful:', result);
        this.carbonCalc.result = result;
      },
      error: (error: any) => {
        console.error('Error calculating carbon footprint:', error);
        // Show error to user instead of calculating on frontend
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors du calcul de l\'empreinte carbone. Veuillez réessayer.'
        });
        
        // Reset result or show placeholder values
        this.carbonCalc.result = {
          carbonFootprint: 0,
          distance: this.carbonCalc.distance,
          emissionFactor: 0.2 // Just for display
        };
      }
    });
  }
  
  /**
   * Update carbon footprint calculation when vehicle type changes
   */
  updateCarbonFootprint() {
    if (this.carbonCalc.distance > 0 && this.carbonCalc.vehicleType) {
      this.calculateCarbonFootprint();
    }
  }
  
  /**
   * Get CSS class based on carbon footprint value
   */
  getCarbonImpactClass(carbonFootprint: number): string {
    if (carbonFootprint === 0) return 'impact-none';
    if (carbonFootprint < 1) return 'impact-low';
    if (carbonFootprint < 5) return 'impact-medium';
    return 'impact-high';
  }
  
  /**
   * Get appropriate icon based on carbon footprint value
   */
  getCarbonImpactIcon(carbonFootprint: number): string {
    if (carbonFootprint === 0) return 'eco';
    if (carbonFootprint < 1) return 'sentiment_satisfied';
    if (carbonFootprint < 5) return 'sentiment_neutral';
    return 'sentiment_very_dissatisfied';
  }
  
  /**
   * Get descriptive text based on carbon footprint value
   */
  getCarbonImpactText(carbonFootprint: number): string {
    if (carbonFootprint === 0) {
      return 'Impact environnemental nul! Excellent choix de transport.';
    }
    if (carbonFootprint < 1) {
      return 'Faible impact environnemental. Bonne option de transport.';
    }
    if (carbonFootprint < 5) {
      return 'Impact environnemental modéré. Pensez à optimiser votre trajet.';
    }
    return 'Impact environnemental élevé. Envisagez des alternatives plus écologiques si possible.';
  }

  showConfirm(orderId: number, action: 'LIVRE' | 'NON_LIVRE') {
    this.currentOrderId = orderId;
    this.resetModal();
    if (action === 'LIVRE') {
      this.startCamera();
    } else {
      this.showReasonInput();
    }
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'flex';
  }

  resetModal() {
    this.isCameraActive = false;
    this.isReasonInputActive = false;
    if (this.reasonInputElement) this.reasonInputElement.nativeElement.value = '';
    this.stopCamera();
  }

  hideConfirm() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
    this.stopCamera();
    this.currentOrderId = null;
    this.isCameraActive = false;
    this.isReasonInputActive = false;
  }

  async startCamera() {
    this.isCameraActive = true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (this.videoElement) this.videoElement.nativeElement.srcObject = this.stream;
    } catch (err) {
      console.error('Camera access error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur Caméra',
        text: 'Impossible d\'accéder à la caméra: ' + (err as Error).message
      });
      this.resetModal();
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  capturePhoto() {
    if (this.videoElement && this.canvasElement && this.currentOrderId) {
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);

      const photoData = canvas.toDataURL('image/png');
      const order = this.commandes.find(o => o.id === this.currentOrderId);
      if (order?.id) {
        order.statusLivraison = 'LIVRE';
        order.photo = photoData;
        
        // Get the corresponding livraison ID from the mapping
        const livraisonId = this.livraisonIdMap[order.id];
        if (livraisonId) {
          console.log(`Using livraison ID ${livraisonId} for commande ID ${order.id}`);
          
          // Update the livraison status using the correct livraison ID
          this.livraisonService.updateLivraison(livraisonId, order).subscribe({
            next: () => {
              console.log('Livraison status updated to LIVRE');
              if (order.id) this.hideOrderWithDelay(order.id);
            },
            error: (error: any) => {
              console.error('Error updating livraison:', error);
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Erreur lors de la mise à jour du status.'
              });
            }
          });
        } else {
          console.error(`No livraison ID found for commande ID ${order.id}`);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de trouver la livraison correspondante.'
          });
        }
      }
      this.stopCamera();
      this.hideConfirm();
    }
  }

  showReasonInput() {
    this.isReasonInputActive = true;
  }

  submitNonLivre() {
    if (this.reasonInputElement && this.currentOrderId) {
      const reason = this.reasonInputElement.nativeElement.value.trim();
      if (reason) {
        const order = this.commandes.find(o => o.id === this.currentOrderId);
        if (order?.id) {
          order.statusLivraison = 'NON_LIVRE';
          order.reason = reason;
          
          // Get the corresponding livraison ID from the mapping
          const livraisonId = this.livraisonIdMap[order.id];
          if (livraisonId) {
            console.log(`Using livraison ID ${livraisonId} for commande ID ${order.id}`);
            
            // Update the livraison status only using the correct livraison ID
            this.livraisonService.updateLivraison(livraisonId, order).subscribe({
              next: () => {
                console.log('Livraison status updated to NON_LIVRE');
                if (order.id) this.hideOrderWithDelay(order.id);
              },
              error: (error: any) => {
                console.error('Error updating livraison:', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Erreur',
                  text: 'Erreur lors de la mise à jour du status.'
                });
              }
            });
          } else {
            console.error(`No livraison ID found for commande ID ${order.id}`);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Impossible de trouver la livraison correspondante.'
            });
          }
        }
        this.hideConfirm();
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Attention',
          text: 'Veuillez fournir une raison pour la non-livraison.'
        });
      }
    }
  }

  private hideOrderWithDelay(orderId: number) {
    if (!orderId) {
      console.error('Cannot hide order without ID');
      return;
    }

    this.hidingOrders.add(orderId);
    this.orderTimers.set(orderId, 10);
    
    const timerInterval = setInterval(() => {
      const currentTime = this.orderTimers.get(orderId);
      if (currentTime && currentTime > 0) {
        this.orderTimers.set(orderId, currentTime - 1);
      }
    }, 1000);
    
    this.timerIntervals.set(orderId, timerInterval);
    
    setTimeout(() => {
      if (this.timerIntervals.has(orderId)) {
        clearInterval(this.timerIntervals.get(orderId));
        this.pendingCommandes = this.pendingCommandes.filter(c => c.id !== orderId);
        this.hidingOrders.delete(orderId);
        this.orderTimers.delete(orderId);
        this.timerIntervals.delete(orderId);
        this.pendingCommandes = [...this.pendingCommandes];
      }
    }, 10000);
  }

  cancelStatusChange(commande: Livraison) {
    if (commande.id) {
      if (this.timerIntervals.has(commande.id)) {
        clearInterval(this.timerIntervals.get(commande.id));
        this.timerIntervals.delete(commande.id);
      }
      
      this.hidingOrders.delete(commande.id);
      this.orderTimers.delete(commande.id);
      
      commande.statusLivraison = commande.isTaken ? 'EN_COURS' : 'TAKE_IT';
      
      this.livraisonService.updateLivraison(commande.id, commande).subscribe({
        next: () => {
          console.log('Status reverted to', commande.statusLivraison);
          this.pendingCommandes = [...this.pendingCommandes];
        },
        error: (error: any) => {
          console.error('Error reverting status:', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors de la réinitialisation du status.'
          });
        }
      });
    }
  }

  getRemainingTime(orderId: number): number {
    return this.orderTimers.get(orderId) || 0;
  }

  private async showDeliveryConfirmation(commande: Livraison, action: 'LIVRE' | 'NON_LIVRE') {
    // Try to get current GPS position for final carbon footprint calculation
    let currentPosition = null;
    try {
      currentPosition = await this.getCurrentGPSPosition();
      console.log('DEBUG - Got current position for carbon calculation (delivery):', currentPosition);
      // Add GPS permission check
      navigator.permissions.query({name:'geolocation'}).then(result => {
        console.log('DEBUG - Geolocation permission status:', result.state);
      });
    } catch (error) {
      console.error('Could not get current position:', error);
      // Continue without GPS data
    }
    
    // Try to geocode destination adresse if not already done
    let destinationPosition = null;
    if (commande.adresse) {
      try {
        destinationPosition = await this.geocodeadresseForCarbon(commande.adresse);
        console.log('Geocoded destination for carbon calculation (delivery):', destinationPosition);
      } catch (error) {
        console.error('Could not geocode destination:', error);
        // Continue without destination geocoding
      }
    }
    
    // Get the photo if available
    const photoData = action === 'LIVRE' && this.capturedPhoto ? this.capturedPhoto : undefined;
    
    // Create the new status object based on action
    const statusUpdate: Livraison = {
      ...commande,
      statusLivraison: action,
      typeLivraison: 'A_DOMICILE', // Ensure we're using a valid type
      photo: photoData,
      reason: action === 'NON_LIVRE' ? this.reasonInputElement.nativeElement.value : undefined,
      // Add GPS coordinates for more accurate carbon footprint
      currentLat: currentPosition ? currentPosition.lat : undefined,
      currentLng: currentPosition ? currentPosition.lng : undefined,
      destinationLat: destinationPosition ? destinationPosition.lat : undefined,
      destinationLng: destinationPosition ? destinationPosition.lng : undefined
    };

    // Add debugging info for GPS coordinates
    console.log('DEBUG - Sending status update with coordinates:', { 
      currentLat: statusUpdate.currentLat, 
      currentLng: statusUpdate.currentLng,
      destinationLat: statusUpdate.destinationLat,
      destinationLng: statusUpdate.destinationLng,
      typeLivraison: statusUpdate.typeLivraison,
      statusLivraison: statusUpdate.statusLivraison
    });
    
    // Check if commande.id exists before updating
    if (!commande.id) {
      console.error('Cannot update livraison: Missing ID');
      return;
    }
    this.livraisonService.updateLivraison(commande.id, statusUpdate).subscribe({
      next: (response: any) => {
        console.log('Livraison updated successfully:', response);
        console.log('DEBUG - Server response after update:', response);
        this.pendingCommandes = [...this.pendingCommandes];
      },
      error: (error: any) => {
        console.error('Error updating livraison:', error);
        alert('Erreur lors de la mise à jour du status.');
      }
    });
  }

  async takeOrder(commande: Livraison) {
    // Check if order is already taken
    if (commande.isTaken) {
      console.log('Order is already taken');
      return;
    }
    
    // Try to get current GPS position for carbon footprint calculation
    let currentPosition = null;
    try {
      currentPosition = await this.getCurrentGPSPosition();
      console.log('Got current position for carbon calculation:', currentPosition);
    } catch (error) {
      console.error('Could not get current position:', error);
      // Continue without GPS data
    }
    
    // Try to geocode destination adresse
    let destinationPosition = null;
    if (commande.adresse) {
      try {
        destinationPosition = await this.geocodeadresseForCarbon(commande.adresse);
        console.log('Geocoded destination for carbon calculation:', destinationPosition);
      } catch (error) {
        console.error('Could not geocode destination:', error);
        // Continue without destination geocoding
      }
    }

    const currentUser = localStorage.getItem('currentUser');
    const userEmail = localStorage.getItem('userEmail') || 'ramzi@example.com';

    if (!currentUser) {
      console.error('Cannot take order: User not logged in', { currentUser, userEmail });
      Swal.fire({
        icon: 'error',
        title: 'Non Connecté',
        text: 'Vous devez être connecté pour prendre une commande'
      });
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user = JSON.parse(currentUser);
      if (!user.id || !user.nom) {
        console.error('Invalid user data:', user);
        Swal.fire({
          icon: 'error',
          title: 'Données Incomplètes',
          text: 'Données utilisateur incomplètes'
        });
        this.router.navigate(['/login']);
        return;
      }

      // Make sure commande.id exists
      if (!commande.id) {
        console.error('Cannot create livraison: Missing commande ID');
        return;
      }
      
      const newLivraison: Livraison = {
        statusLivraison: 'EN_COURS',
        typeLivraison: 'A_DOMICILE', // Using a value that exists in the database
        livreur: {
          id: user.id,
          nom: user.prenom + ' ' + user.nom,
          email: user.email,
          telephone: user.telephone || '',
          userId: user.id
        },
        commandeId: commande.id, // This is now guaranteed to be a number
        // Add GPS coordinates for carbon footprint calculation
        currentLat: currentPosition ? currentPosition.lat : undefined,
        currentLng: currentPosition ? currentPosition.lng : undefined,
        destinationLat: destinationPosition ? destinationPosition.lat : undefined,
        destinationLng: destinationPosition ? destinationPosition.lng : undefined,
        isTaken: true
      };

      console.log('Attempting to create livraison:', JSON.stringify(newLivraison, null, 2));

      this.livraisonService.createLivraison(newLivraison).subscribe({
        next: (response: any) => {
          console.log('Livraison created successfully:', response);
          
          // Store the livraison ID mapping if it's available in the response
          if (response && response.id && commande.id) {
            this.livraisonIdMap[commande.id] = response.id;
            console.log(`Mapped commande ID ${commande.id} to livraison ID ${response.id}`);
            
            // Also store this mapping in localStorage for persistence
            this.storeLivraisonIdMapping(commande.id, response.id);
          }
          
          // Comment out the commande status update since the endpoint doesn't exist
          // console.log('Attempting to update commande status in backend with params:', {
          //   id: commande.id,
          //   status: 'EN_COURS',
          //   livreurId: user.id
          // });
          // this.livraisonService.updateCommandeStatus(commande.id!, 'EN_COURS', user.id)
          //   .subscribe({
          //     next: (updatedCommande) => {
          //       console.log('Commande status updated in backend:', updatedCommande);
          //     },
          //     error: (error) => {
          //       console.error('Failed to update commande status in backend:', error);
          //       // Still continue as the livraison was created
          //     }
          //   });
          
          // Update local commande object
          commande.isTaken = true;
          commande.statusLivraison = 'EN_COURS';
          commande.livreur = newLivraison.livreur;
          
          // Store the livraison data in localStorage to persist across page reloads
          this.storeCommandeAssignment(commande.id!, newLivraison.livreur);
          
          // Update commandes and pendingCommandes arrays
          const commandeIndex = this.commandes.findIndex(c => c.id === commande.id);
          if (commandeIndex !== -1) {
            this.commandes[commandeIndex] = { ...commande };
          }
          const pendingIndex = this.pendingCommandes.findIndex(c => c.id === commande.id);
          if (pendingIndex !== -1) {
            this.pendingCommandes[pendingIndex] = { ...commande };
          }
          // Trigger UI update
          this.pendingCommandes = [...this.pendingCommandes];
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Commande prise en charge avec succès'
          });
          // Optional: Call loadCommandes() only if needed (e.g., to sync other orders)
          // this.loadCommandes();
        },
        error: (error: { message: any; }) => {
          console.error('Failed to create livraison:', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: `Erreur lors de la prise en charge: ${error.message || 'Veuillez réessayer'}`
          });
        }
      });
    } catch (error) {
      console.error('Error processing user data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Problème avec les données utilisateur'
      });
      this.router.navigate(['/login']);
    }
  }
  
  private storeCommandeAssignment(commandeId: number, livreur: Livraison['livreur']) {
    const existingAssignments = localStorage.getItem('livraisonAssignments');
    if (existingAssignments) {
      const assignments: { [commandeId: number]: Livraison['livreur'] } = JSON.parse(existingAssignments);
      assignments[commandeId] = livreur;
      localStorage.setItem('livraisonAssignments', JSON.stringify(assignments));
    } else {
      const newAssignments: { [commandeId: number]: Livraison['livreur'] } = { [commandeId]: livreur };
      localStorage.setItem('livraisonAssignments', JSON.stringify(newAssignments));
    }
  }

  private loadStoredCommandeAssignments(): { [commandeId: number]: Livraison['livreur'] } {
    const storedAssignments = localStorage.getItem('livraisonAssignments');
    if (storedAssignments) {
      return JSON.parse(storedAssignments);
    }
    return {};
  }

  private loadLivraisonIdMappings(): { [commandeId: number]: number } {
    const storedMappings = localStorage.getItem('livraisonIdMappings');
    if (storedMappings) {
      return JSON.parse(storedMappings);
    }
    return {};
  }

  private storeLivraisonIdMapping(commandeId: number, livraisonId: number) {
    const existingMappings = localStorage.getItem('livraisonIdMappings');
    if (existingMappings) {
      const mappings: { [commandeId: number]: number } = JSON.parse(existingMappings);
      mappings[commandeId] = livraisonId;
      localStorage.setItem('livraisonIdMappings', JSON.stringify(mappings));
    } else {
      const newMappings: { [commandeId: number]: number } = { [commandeId]: livraisonId };
      localStorage.setItem('livraisonIdMappings', JSON.stringify(newMappings));
    }
  }
}