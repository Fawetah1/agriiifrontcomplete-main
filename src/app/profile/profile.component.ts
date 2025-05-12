import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

// Interface for User to improve type safety
interface User {
  id: number | null;
  nom: string;
  prenom: string;
  email: string;
  numeroDeTelephone: string;
  role: string;
  adresseLivraison: string;
  photo: string | null; // Store the filename or path, not the full URL
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  userId: number | null = null;
  livreurId: number | null = null;
  isSidebarCollapsed = false;
  user: User = {
    id: null,
    nom: '',
    prenom: '',
    email: '',
    numeroDeTelephone: '',
    role: '',
    adresseLivraison: '',
    photo: null,
  };
  isUploading = false;
  uploadError: string | null = null;
  uploadSuccess: string | null = null;
  photoPreviewUrl: string | null = null; // Separate property for preview
  private apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('userId');
      this.userId = id ? +id : null;
      this.loadUserProfile();
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userEmail');
    this.router.navigate(['/login']);
  }

  loadUserProfile() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      if (user.id === this.userId) {
        this.user = user;
        if (user.role.toLowerCase() === 'livreur') {
          this.fetchLivreurDetails(user.id);
        }
      } else {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  fetchLivreurDetails(userId: number) {
    this.userId = userId;
    // No need for updateUserPhoto() here; getUserPhotoUrl() is used in the template
  }

  private isTokenExpired(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return true;

    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      return tokenData.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.uploadError = 'Please select an image file (PNG, JPG)';
        this.uploadSuccess = null;
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'Image size must be less than 5MB';
        this.uploadSuccess = null;
        return;
      }

      // Set preview URL for display (temporary Data URL)
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreviewUrl = reader.result as string; // Use separate preview property
      };
      reader.readAsDataURL(file);

      this.isUploading = true;
      this.uploadError = null;
      this.uploadSuccess = null;

      this.uploadPhoto(file);
    }
  }

  uploadPhoto(file: File) {
    if (!this.userId) {
      this.isUploading = false;
      this.uploadError = 'User ID is missing';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    this.http
      .post(`${this.apiUrl}/api/users/${this.userId}/upload-photo`, formData, {
        responseType: 'text',
      })
      .subscribe({
        next: (response) => {
          // Store the filename or path returned by the server
          this.user.photo = response;
          this.photoPreviewUrl = null; // Clear preview after successful upload
          this.isUploading = false;
          this.uploadSuccess = 'Profile photo updated successfully!';
          this.uploadError = null;

          // Update localStorage with new photo information
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          currentUser.photo = response;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        },
        error: (err) => {
          console.error('Photo upload error:', err);
          this.isUploading = false;
          this.uploadError = 'Failed to upload photo. Please try again.';
          this.uploadSuccess = null;
        },
      });
  }

  goBack() {
    if (this.userId) {
      this.router.navigate(['/livraison', this.userId]);
    } else {
      this.router.navigate(['/login']);
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
  }

  getUserPhotoUrl(): string {
    if (this.photoPreviewUrl) {
      return this.photoPreviewUrl; // Return preview URL if available (during upload)
    }
      return `${this.apiUrl}/api/users/photo/${this.user.photo}`; // Use environment API URL
  }
}