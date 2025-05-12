import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../user.service';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.css']
})
export class MyAccountComponent implements OnInit {
  currentUser: User | null = null;
  isEditing: boolean = false;
  editedUser: Partial<User> = {};
  successMessage: string = '';
  errorMessage: string = '';
  defaultPhotoUrl: string = 'assets/images/avatar.png';
  hasImageLoadError: boolean = false;
  previewUrl: string | null = null;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      this.editedUser = { ...this.currentUser };
    } else {
      // Navigate to login if no user is found
      this.router.navigate(['/login']);
    }
  }

  getPhotoUrl(): string {
    if (this.previewUrl) {
      return this.previewUrl;
    }
    if (this.hasImageLoadError || !this.currentUser?.photo) {
      return this.defaultPhotoUrl;
    }
    return `http://localhost:8082/api/users/photo/${this.currentUser.photo}`;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !this.hasImageLoadError) {
      this.hasImageLoadError = true;
      img.src = this.defaultPhotoUrl;
    }
  }

  onEdit(): void {
    this.isEditing = true;
    this.editedUser = { ...this.currentUser! };
  }

  onCancel(): void {
    this.isEditing = false;
    this.editedUser = { ...this.currentUser! };
    this.errorMessage = '';
  }

  onSave(): void {
    if (!this.currentUser?.id || !this.editedUser.id) return;
    
    // Ensure required fields are present
    const updatedUser: User = {
      ...this.currentUser,
      ...this.editedUser,
      numeroDeTelephone: this.currentUser.numeroDeTelephone,
      isBlocked: this.currentUser.isBlocked
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: (updatedUser: User) => {
        this.currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.isEditing = false;
        this.showSuccess('Profil mis à jour avec succès!');
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la mise à jour du profil';
        console.error('Update error:', error);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file && this.currentUser?.id) {
      // Vérification de la taille et du type du fichier
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        this.errorMessage = 'Le fichier est trop volumineux (5MB maximum)';
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Veuillez sélectionner une image valide';
        return;
      }

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);
      
      this.userService.uploadPhoto(this.currentUser.id, formData).subscribe({
        next: (photoPath: string) => {
          if (this.currentUser) {
            this.currentUser.photo = photoPath;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.hasImageLoadError = false;
            this.previewUrl = null; // Réinitialiser la prévisualisation
            this.showSuccess('Photo de profil mise à jour!');
          }
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors du téléchargement de la photo';
          console.error('Upload error:', error);
        }
      });
    }
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }
}