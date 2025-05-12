import { Component } from '@angular/core';
import { UserService } from '../user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';

  constructor(private userService: UserService, private router: Router) {}

  onSubmit(): void {
    this.userService.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.message = '✅ Code envoyé ! Redirection...';
        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.email }
          });
        }, 2000);
      },
      error: (err) => {
        this.message = '❌ ' + (err.error || 'Erreur lors de la demande de réinitialisation.');
      }
    });
  }
}
