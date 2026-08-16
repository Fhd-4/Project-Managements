import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_CONFIG } from '../../api.config';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection!: signalR.HubConnection;
  private messageSource = new BehaviorSubject<any>(null);
  public currentMessage$ = this.messageSource.asObservable();

  constructor(private http: HttpClient) {
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

    // الاستماع لحدث استقبال الرسائل (ReceiveMessage) بشكل ديناميكي (كائن واحد أو 3 أو 4 بارامترات)
    this.hubConnection.on('ReceiveMessage', (...args: any[]) => {
      console.log('ReceiveMessage event args received:', args);
      let user = '';
      let content = '';
      let timestamp = '';

      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        const msgObj = args[0];
        const senderId = msgObj.senderId || msgObj.sender || '';
        const senderName = msgObj.senderName || msgObj.senderUserName || msgObj.userName || '';
        user = senderName || senderId;
        content = msgObj.content || msgObj.message || '';
        timestamp = msgObj.timestamp || '';
      } else if (args.length === 4) {
        const [senderId, senderName, msgContent, msgTimestamp] = args;
        user = senderName || senderId; // استخدام الاسم المباشر إذا وجد، وإلا معرّف المرسل
        content = msgContent;
        timestamp = msgTimestamp;
      } else {
        const [senderNameOrId, msgContent, msgTimestamp] = args;
        user = senderNameOrId;
        content = msgContent;
        timestamp = msgTimestamp;
      }

      this.messageSource.next({ user, message: content, timestamp, isIncoming: true });
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

  // دالة إرسال الرسالة للباك إند عبر Method (SendMessage) الجماعي (بدون ID المستلم)
  public sendMessage(message: string): Promise<void> {
    return this.hubConnection.invoke('SendMessage', message)
      .catch(err => console.error('Error while sending message: ', err));
  }

  // جلب سجل المحادثات الجماعية من السيرفر
  public getChatHistory(): Observable<any> {
    let token = '';
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('auth_token') || '';
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${API_CONFIG.baseUrl}/Chat/history`, { headers });
  }
}