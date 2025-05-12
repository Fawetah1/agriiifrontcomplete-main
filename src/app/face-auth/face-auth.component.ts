import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as faceapi from '@vladmandic/face-api';

@Component({
  selector: 'app-face-auth',
  templateUrl: './face-auth.component.html',
  styleUrls: ['./face-auth.component.css']
})
export class FaceAuthComponent implements OnInit {

  @ViewChild('videoElement', { static: true }) videoElement!: ElementRef;

  message = '';
  descriptorJson: string | null = null;

  async ngOnInit() {
    await this.loadModels();
    await this.startCamera();
  }

  async loadModels() {
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
      console.log("✅ Modèles chargés");
    } catch (error) {
      console.error("❌ Erreur chargement modèles", error);
      this.message = "Erreur lors du chargement des modèles.";
    }
  }

  async startCamera() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log("📷 Caméras disponibles :", videoDevices);
  
      if (videoDevices.length === 0) {
        this.message = "❌ Aucune caméra trouvée.";
        return;
      }
  
      const selectedDeviceId = videoDevices[1]?.deviceId || videoDevices[0].deviceId; // essaie d'ignorer iVCam
  
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDeviceId }
      });
  
      const video = this.videoElement.nativeElement as HTMLVideoElement;
      video.srcObject = stream;
      video.play();
      console.log("🎥 Caméra démarrée");
    } catch (err) {
      console.error("❌ Erreur caméra :", err);
      this.message = "❌ Impossible d'accéder à la caméra.";
    }
  }
  

  async captureFace() {
    const video = this.videoElement.nativeElement as HTMLVideoElement;
    const detection = await faceapi
      .detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      this.message = '❌ Aucun visage détecté.';
      return;
    }

    const descriptor = detection.descriptor;
    this.descriptorJson = JSON.stringify(Array.from(descriptor));
    this.message = '✅ Visage capturé avec succès.';
    console.log("📸 Descripteur facial :", this.descriptorJson);
  }

  onCopy() {
    if (this.descriptorJson) {
      navigator.clipboard.writeText(this.descriptorJson);
      this.message = '📋 Descripteur copié !';
    }
  }
}
