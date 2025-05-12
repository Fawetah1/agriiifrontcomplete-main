import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-photo-upload-test',
  templateUrl: './photo-upload-test.component.html',
  styleUrls: ['./photo-upload-test.component.css']
})
export class PhotoUploadTestComponent {
  selectedFile: File | null = null;
  message: string = '';
  previewUrl: string | null = null;
  userId: number = 111; // remplace par l'ID réel si besoin

  constructor(private http: HttpClient) {}

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

  upload(): void {
    if (!this.selectedFile) {
      this.message = 'Aucun fichier sélectionné.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`http://localhost:8082/api/users/${this.userId}/upload-photo`, formData, {
      responseType: 'text'
    }).subscribe({
      next: res => this.message = '✅ Upload réussi : ' + res,
      error: err => this.message = '❌ Erreur : ' + (err.error || 'inconnue')
    });
  }
}
