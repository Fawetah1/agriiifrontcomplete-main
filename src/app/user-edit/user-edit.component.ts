import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, User } from '../user.service';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css']
})
export class UserEditComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  user: User = {
    id: 0,
    nom: '',
    prenom: '',
    email: '',
    numeroDeTelephone: '',
    role: '',
    isBlocked: false,
    photo: '',
    motDePasse: ''
  };

  message: string = '';
  userId: number = 0;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));

    this.userService.getUsers().subscribe(users => {
      const found = users.find(u => u.id === this.userId);
      if (found) {
        this.user = { ...found };
      }
    });
  }

  getUserPhotoUrl(user: User): string {
    if (user.photo) {
      return `http://localhost:8082/api/users/photo/${user.photo}`;
    }
    // Générer un avatar basé sur le nom et prénom de l'utilisateur
    return `https://ui-avatars.com/api/?name=${user.nom}+${user.prenom}&background=0D8ABC&color=fff`;
  }

  onPhotoClick(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('photo', file);

      this.userService.uploadPhoto(this.userId, formData).subscribe({
        next: (filename) => {
          this.user.photo = filename;
          this.message = '✅ Photo mise à jour avec succès';
          setTimeout(() => {
            this.message = '';
          }, 3000);
        },
        error: () => {
          this.message = '❌ Erreur lors du téléchargement de la photo';
          setTimeout(() => {
            this.message = '';
          }, 3000);
        }
      });
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.getUserPhotoUrl(this.user);
    }
  }

  onSubmit(): void {
    // ✅ Supprimer manuellement motDePasse du payload
    const payload: any = { ...this.user };
    delete payload.motDePasse;

    this.userService.updateUser(payload).subscribe({
      next: () => {
        this.message = '✅ Utilisateur mis à jour avec succès';
        setTimeout(() => {
          this.router.navigate(['/users']);
        }, 1500);
      },
      error: () => {
        this.message = '❌ Erreur lors de la mise à jour';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}
