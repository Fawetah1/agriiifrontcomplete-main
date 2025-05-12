import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client;
  private notificationSubject = new Subject<any>();
  public notifications$ = this.notificationSubject.asObservable();

  constructor() {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8082/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('STOMP Debug: ', str);
      },
      onConnect: (frame) => {
        console.log('WebSocket Connected');
        this.subscribeToNotifications('client');
      },
      onStompError: (frame) => {
        console.error('STOMP Error: ', frame);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error: ', error);
      },
      onWebSocketClose: (event) => {
        console.error('WebSocket Closed: ', event);
      }
    });
  }

  public connect(): void {
    if (!this.stompClient.active) {
      console.log('Connecting to WebSocket...');
      this.stompClient.activate();
    }
  }

  public subscribeToNotifications(role: string): void {
    if (!this.stompClient.connected) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }
    const topic = role === 'client' ? '/topic/notifications/clients' : '/topic/notifications';
    console.log('Subscribing to topic:', topic);
    this.stompClient.subscribe(topic, (message: IMessage) => {
      console.log('Raw message received:', message.body);
      try {
        const parsedMessage = JSON.parse(message.body);
        console.log('Parsed notification:', parsedMessage);
        this.notificationSubject.next(parsedMessage);
      } catch (e) {
        console.error('Error parsing notification:', e, 'Raw message:', message.body);
      }
    }, { id: 'notification-subscription' });
  }

  public disconnect(): void {
    if (this.stompClient.active) {
      console.log('Disconnecting from WebSocket...');
      this.stompClient.deactivate();
    }
  }
}