import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import anime from 'animejs/lib/anime.es.js';
import * as faceapi from '@vladmandic/face-api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit, OnInit {
  credentials = { email: '', motDePasse: '' };
  message = '';
  distanceScore: number | null = null;
  videoElement!: HTMLVideoElement;
  cameraReady = false;
  modelsLoaded = false;
  useFaceLogin = false;
  analysisResult: { age: string, gender: string, expression: string } | null = null;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.loadModels();
  }

  async loadModels() {
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
      this.modelsLoaded = true;
    } catch (err) {
      this.message = '❌ Erreur lors du chargement des modèles.';
    }
  }

  ngAfterViewInit() {
    // Animation anime.js si besoin
  }

  toggleLoginMode() {
    this.useFaceLogin = !this.useFaceLogin;
    if (this.useFaceLogin && this.modelsLoaded) {
      setTimeout(() => this.initCamera(), 200);
    }
  }

  onSubmit(): void {
    this.userService.login(this.credentials).subscribe(
      (user: any) => {
        this.message = 'Connexion réussie.';
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('currentUserId', user.id.toString());
        console.log('currentUserId stored in localStorage:', localStorage.getItem('currentUserId'));

  
        // Check user role and redirect with userId
        if (user && user.role && user.id) {
          const role = user.role.trim().toLowerCase();
          if (role === 'admin') {
            this.router.navigate(['/users']);
          } else if (role === 'livreur') {
            this.router.navigate(['/livraison', user.id]);
          } else if (role === 'user') {
            this.router.navigate(['homeclient']);
          } else if (role === 'agriculteur') {
            this.router.navigate(['/home']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.router.navigate(['/']);
        }
      },
      (error: any) => {
        console.error('Erreur de login :', error);
        this.message = 'Erreur de login : ' + (error.error?.error || 'Une erreur est survenue');
      }
    );
  }
  

  redirectAfterLogin(role: string) {
    console.log("✅ Connexion réussie. Redirection...");
    if (role?.trim().toLowerCase() === 'admin') {
      this.router.navigate(['/users']).then(() => window.location.reload());
    } else {
      this.router.navigate(['/']).then(() => window.location.reload());
    }
  }

  async initCamera() {
    try {
      const video = document.getElementById('video') as HTMLVideoElement;
      if (!video) throw new Error('Élément vidéo non trouvé');
  
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Forcer caméra intégrée
      const selectedDevice = videoDevices.find(device =>
        device.label.toLowerCase().includes('integrated')
      ) || videoDevices[0];
  
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDevice.deviceId }
      });
  
      video.srcObject = stream;
      video.play();
  
      this.videoElement = video;
      this.cameraReady = true;
      console.log('✅ Caméra intégrée activée');
    } catch (err) {
      this.message = '❌ Impossible d’ouvrir la caméra.';
      console.error(err);
    }
  }
  
  async loginWithFace() {
    if (!this.cameraReady) {
      this.message = '❌ Caméra non disponible';
      return;
    }
  
    const result = await faceapi.detectSingleFace(this.videoElement).withFaceLandmarks().withFaceDescriptor();
    if (!result) {
      this.message = '❌ Aucun visage détecté';
      return;
    }
  
    const descriptor = Array.from(result.descriptor);
    this.userService.loginWithFace(JSON.stringify(descriptor)).subscribe(
      (user: any) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.captureImage().then((blob) => {
          this.userService.analyzeFace(blob).subscribe({
            next: (res) => {
              localStorage.setItem('faceAnalysis', JSON.stringify(res));
              this.router.navigate(['/users']);
            }
          });
        });
      },
      (error: any) => {
        this.message = '❌ Échec de la connexion faciale.';
      }
    );
  }
  
  

  captureImage(): Promise<Blob> {
    const video = document.getElementById('video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossible de dessiner');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject('Erreur de capture'), 'image/jpeg');
    });
  }
}