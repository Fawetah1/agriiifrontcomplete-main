import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, User } from '../user.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent {
  user: Partial<User> = {
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    numeroDeTelephone: '',
    role: 'user'
  };

  constructor(private userService: UserService, private router: Router) {}

  onSubmit(): void {
    this.userService.registerUser(this.user).subscribe(() => {
      alert('Utilisateur ajouté avec succès');
      this.router.navigate(['/users']);
    });
  }
}
