// src/app/services/promotion/promotion-update.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PromotionUpdateService {
  private updateSource = new Subject<void>();
  updates$ = this.updateSource.asObservable();

  notifyUpdates() {
    this.updateSource.next();
  }
}