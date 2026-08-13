import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection!: signalR.HubConnection;
  private messageSource = new BehaviorSubject<any>(null);
  public currentMessage$ = this.messageSource.asObservable();

  constructor() {
    this.initConnection();
  }

  private initConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://prosync-swagger.runasp.net/chathub', {
        accessTokenFactory: () => {
          if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem('auth_token') || '';
          }
          return '';
        },
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .configureLogging(signalR.LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR connected successfully!'))
      .catch(err => console.error('SignalR connection failed:', err));

    // الاستماع لحدث استقبال الرسائل (ReceiveMessage)
    // الباك إند يرسل: senderId, content, timestamp
    this.hubConnection.on('ReceiveMessage', (senderId: string, content: string, timestamp: string) => {
      this.messageSource.next({ user: senderId, message: content, timestamp, isIncoming: true });
    });
  }

  // محاولة تشغيل الاتصال إذا كان مغلقاً (مثال: بعد تسجيل الدخول)
  public startConnection() {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      this.hubConnection.start()
        .then(() => console.log('SignalR connected successfully on demand!'))
        .catch(err => console.error('SignalR manual connection failed:', err));
    }
  }

  // دالة إرسال الرسالة للباك إند عبر Method (SendMessage)
  public sendMessage(user: string, message: string): Promise<void> {
    return this.hubConnection.invoke('SendMessage', user, message)
      .catch(err => console.error('Error while sending message: ', err));
  }
}