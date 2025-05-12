import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: { message: string, id: number }[] = [];
  private sub!: Subscription;
  private notificationId = 0;

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    console.log('NotificationComponent initialized, connecting to WebSocket...');
    this.webSocketService.connect();

    // Test manuel pour vérifier que le pop-up fonctionne
    this.notifications.push({ message: 'Test pop-up manuel', id: this.notificationId++ });
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== this.notificationId - 1);
    }, 5000);

    this.sub = this.webSocketService.notifications$.subscribe(
      notification => {
        console.log('New notification received:', notification);
        this.notifications.push({ message: notification.message, id: this.notificationId++ });
        console.log('Current notifications:', this.notifications);
        setTimeout(() => {
          this.notifications = this.notifications.filter(n => n.id !== this.notificationId - 1);
        }, 5000);
      },
      error => {
        console.error('Error in notification subscription:', error);
      }
    );
  }

  ngOnDestroy(): void {
    console.log('NotificationComponent destroyed, disconnecting WebSocket...');
    if (this.sub) this.sub.unsubscribe();
    this.webSocketService.disconnect();
  }
}