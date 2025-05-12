import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  photo?: string;
  isBlocked?: boolean;
  phone?: string;
  location?: string;
  joinDate?: string;
  department?: string;
  projectsCount?: number;
  tasksCompleted?: number;
  rating?: number;
  gallery?: string[];
  achievements?: string[];
}

export interface ExtendedUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  isBlocked?: boolean;
  photo?: string;
  risk_score?: number;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: ExtendedUser[] = [];
  allUsers: ExtendedUser[] = [];
  searchTerm: string = '';
  selectedRole: string = 'all';
  totalUsers: number = 0;
  isLoading: boolean = false;
  successMessage: string | null = null;

  page: number = 1;
  pageSize: number = 10;
  pages: number[] = [];
  isSidebarOpen: boolean = true;

  currentUser: ExtendedUser = {
    id: 0,
    nom: '',
    prenom: '',
    email: '',
    role: '',
    photo: ''
  };
  showProfileMenu: boolean = false;

  notificationMessage: string | null = null;

  constructor(
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const userData = JSON.parse(stored);
      this.currentUser = {
        ...userData
      };
    }

    const analysis = localStorage.getItem('faceAnalysis');
    if (analysis) {
      const parsed = JSON.parse(analysis);
      const mood = parsed.expression?.toLowerCase() || 'neutre';
      const suggestion = this.getSuggestion(mood);
      this.notificationMessage = `👋 Bonjour ${this.currentUser.nom}, vous semblez ${mood} aujourd'hui. ${suggestion}`;
      localStorage.removeItem('faceAnalysis');

      setTimeout(() => {
        this.notificationMessage = null;
        this.cdr.detectChanges();
      }, 7000);
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.users = [];
    this.allUsers = [];
    this.cdr.detectChanges();

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users.map(user => {
          const baseUser = user as User;
          const extendedUser: ExtendedUser = {
            id: baseUser.id,
            nom: baseUser.nom,
            prenom: baseUser.prenom,
            email: baseUser.email,
            role: baseUser.role,
            isBlocked: baseUser.isBlocked || false,
            photo: baseUser.photo,
            risk_score: undefined
          };
          return extendedUser;
        });

        this.users = [...this.allUsers];
        this.totalUsers = users.length;

        this.allUsers.forEach(user => {
          this.userService.getRiskScore(user.id).subscribe({
            next: (res) => {
              const index = this.allUsers.findIndex(u => u.id === user.id);
              if (index !== -1) {
                this.allUsers[index].risk_score = res.risk_score;
                this.filterUsers();
              }
            },
            error: () => {
              const index = this.allUsers.findIndex(u => u.id === user.id);
              if (index !== -1) {
                this.allUsers[index].risk_score = undefined;
                this.filterUsers();
              }
            }
          });
        });

        this.filterUsers();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getSuggestion(mood: string): string {
    switch (mood) {
      case 'happy': return '🍓 Une fraise pour garder le sourire !';
      case 'sad': return '🍌 Une banane pour retrouver la pêche.';
      case 'neutral': return '🍏 Une pomme par jour éloigne le médecin !';
      case 'angry': return '🥕 Une carotte pour se calmer un peu ?';
      case 'surprised': return '🍍 Un ananas pour fêter ça ?';
      default: return '🍇 Quelques raisins pour se détendre.';
    }
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  onGoToMyAccount(): void {
    this.showProfileMenu = false;
    this.router.navigate(['/my-account']);
  }

  filterUsers(): void {
    let filtered = [...this.allUsers];

    if (this.selectedRole !== 'all') {
      filtered = filtered.filter(user =>
        user.role.trim().toLowerCase() === this.selectedRole
      );
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(user =>
        `${user.nom} ${user.prenom} ${user.email}`.toLowerCase().includes(term)
      );
    }

    this.totalUsers = filtered.length;
    const start = (this.page - 1) * this.pageSize;
    const end = this.page * this.pageSize;
    this.users = filtered.slice(start, end);
    this.pages = Array.from({ length: Math.ceil(this.totalUsers / this.pageSize) }, (_, i) => i + 1);
    this.cdr.detectChanges();
  }

  onSearch(): void {
    this.page = 1;
    this.filterUsers();
  }

  onRoleChange(): void {
    this.page = 1;
    this.filterUsers();
  }

  goToPage(p: number): void {
    this.page = p;
    this.filterUsers();
  }

  nextPage(): void {
    if (this.page < this.pages.length) {
      this.page++;
      this.filterUsers();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.filterUsers();
    }
  }

  onUpdateUser(user: ExtendedUser): void {
    this.router.navigate(['/users/edit', user.id]);
  }

  onDeleteUser(user: ExtendedUser): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.nom} ${user.prenom} ?`)) {
      this.isLoading = true;
      this.userService.deleteUser(user.id).subscribe({
        next: (response: any) => {
          console.log('Réponse suppression:', response);
          this.showSuccess('Utilisateur supprimé avec succès');
          window.location.reload();
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }

  }

  onAddUser(): void {
    this.router.navigate(['/users/add']);
  }

  onLogout(): void {
    this.userService.logoutBackend();
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  onBlockUser(user: ExtendedUser): void {
    if (confirm(`Voulez-vous bloquer ${user.nom} ${user.prenom} ?`)) {
      this.isLoading = true;
      this.userService.blockUser(user.id, true).subscribe({
        next: (response: any) => {
          console.log('Réponse blocage:', response);
          this.showSuccess('Utilisateur bloqué avec succès');
          window.location.reload();
        },
        error: (error: any) => {
          console.error('Erreur lors du blocage:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onUnblockUser(user: ExtendedUser): void {
    if (confirm(`Voulez-vous débloquer ${user.nom} ${user.prenom} ?`)) {
      this.isLoading = true;
      this.userService.blockUser(user.id, false).subscribe({
        next: (response: any) => {
          console.log('Réponse déblocage:', response);
          this.showSuccess('Utilisateur débloqué avec succès');
          window.location.reload();
        },
        error: (error: any) => {
          console.error('Erreur lors du déblocage:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  getUserPhotoUrl(user: User): string {
    if (user.photo) {
      return `http://localhost:8082/api/users/photo/${user.photo}`;
    }
    // Générer un avatar basé sur le nom et prénom de l'utilisateur
    return `https://ui-avatars.com/api/?name=${user.nom}+${user.prenom}&background=0D8ABC&color=fff`;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/avatar.png';
    }
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }
}