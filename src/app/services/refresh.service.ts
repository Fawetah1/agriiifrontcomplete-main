import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RefreshService {
    private promotionUpdatedSource = new Subject<void>();
    promotionUpdated$ = this.promotionUpdatedSource.asObservable();

    notifyPromotionUpdated(): void {
        this.promotionUpdatedSource.next();
    }
}