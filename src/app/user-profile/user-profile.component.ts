import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  currentUser: User = {
    id: 0,
    nom: '',
    prenom: '',
    email: '',
    numeroDeTelephone: '',
    role: '',
    isBlocked: false,
    photo: ''
  };

  message: string = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
    }
  }

  onSave(): void {
    this.userService.updateUser(this.currentUser).subscribe({
      next: (updatedUser) => {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.router.navigate(['/users']);
      },
      error: () => {
        this.message = '❌ Erreur lors de la mise à jour';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadPhoto(): void {
    if (!this.selectedFile || !this.currentUser.id) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.userService.uploadPhoto(this.currentUser.id, formData).subscribe({
      next: (filename) => {
        this.currentUser.photo = filename;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.previewUrl = null;
        this.message = '📸 Photo mise à jour avec succès';
      },
      error: () => {
        this.message = '❌ Erreur lors de l’upload de la photo';
      }
    });
  }

  getUserPhotoUrl(): string {
    return this.currentUser?.photo
      ? `http://localhost:8082/uploads/${this.currentUser.photo}`
      : `https://ui-avatars.com/api/?name=${this.currentUser.nom}+${this.currentUser.prenom}`;
  }
}
