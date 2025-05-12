import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-verify-account',
  templateUrl: './verify-account.component.html',
  styleUrls: ['./verify-account.component.css']
})
export class VerifyAccountComponent {
  email: string = '';
  code: string = '';
  message: string = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
  }

  onVerify(): void {
   
    const trimmedCode = this.code.trim();

    this.userService.verifyAccount(this.email, trimmedCode).subscribe({
      next: (res: any) => {
        this.message = '✅ Compte vérifié avec succès ! Vous pouvez maintenant vous connecter.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.message = '❌ ' + (err.error || 'Échec de vérification.');
      }
    });
  }
}
