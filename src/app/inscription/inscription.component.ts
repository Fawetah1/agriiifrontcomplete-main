import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import * as faceapi from '@vladmandic/face-api';

@Component({
  selector: 'app-inscription',
  templateUrl: './inscription.component.html',
  styleUrls: ['./inscription.component.css']
})
export class InscriptionComponent implements OnInit {
  user = {
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    numeroDeTelephone: '',
    role: 'user',
    adresseLivraison: '',
    faceDescriptor: ''
  };

  message: string = '';
  videoElement!: HTMLVideoElement;
  cameraReady: boolean = false;
  useFaceCapture: boolean = false;
  stream!: MediaStream;

  constructor(private userService: UserService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.loadModels();
  }

  async loadModels() {
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
      console.log("✅ Modèles chargés");
    } catch (err) {
      console.error("❌ Erreur chargement modèles:", err);
      this.message = "❌ Erreur lors du chargement des modèles.";
    }
  }

  async initCamera() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const selectedDevice = videoDevices.find(device =>
        !device.label.toLowerCase().includes('ivcam')
      ) || videoDevices[0];

      this.videoElement = document.getElementById('preview') as HTMLVideoElement;
      if (!this.videoElement) throw new Error('Élément vidéo non trouvé');

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDevice.deviceId }
      });

      this.videoElement.srcObject = this.stream;
      this.cameraReady = true;
      console.log("🎥 Caméra activée :", selectedDevice.label);
    } catch (err) {
      this.message = "❌ Impossible d'accéder à la caméra.";
      console.error("Erreur caméra :", err);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.cameraReady = false;
  }

  toggleFaceCapture(event: Event) {
    const input = event.target as HTMLInputElement;
    this.useFaceCapture = input.checked;

    if (this.useFaceCapture) {
      this.initCamera();
    } else {
      this.stopCamera();
      this.user.faceDescriptor = '';
    }
  }

  async captureFace() {
    if (!this.cameraReady) {
      await this.initCamera();
    }

    await new Promise((res) => setTimeout(res, 300));

    const detection = await faceapi
      .detectSingleFace(this.videoElement)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      this.message = "❌ Aucun visage détecté.";
      return;
    }

    const descriptor = detection.descriptor;
    this.user.faceDescriptor = JSON.stringify(Array.from(descriptor));
    this.message = "✅ Visage capturé avec succès.";
    console.log("📸 Descripteur facial :", this.user.faceDescriptor);
  }

  onSubmit(): void {
    if (this.useFaceCapture && !this.user.faceDescriptor) {
      this.message = "❌ Veuillez capturer votre visage avant de soumettre.";
      return;
    }

    this.userService.registerUser(this.user).subscribe({
      next: () => {
        this.router.navigate(['/verify'], {
          queryParams: { email: this.user.email }
        });
      },
      error: (error) => {
        console.error('❌ Erreur d\'inscription :', error);
        this.message = error.status === 409
          ? '❌ Cet email est déjà utilisé.'
          : '❌ Une erreur est survenue.';
      }
    });
  }
}
