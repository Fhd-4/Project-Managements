import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_CONFIG } from '../../api.config';

export interface ReactionEvent {
  messageId: number | string;
  userId: string;
  userName?: string;
  emoji: string;
  isRemoved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection!: signalR.HubConnection;
  
  private messageSource = new BehaviorSubject<any>(null);
  public currentMessage$ = this.messageSource.asObservable();

  private typingSource = new BehaviorSubject<{ user: string, isTyping: boolean } | null>(null);
  public typingStatus$ = this.typingSource.asObservable();

  private reactionSource = new Subject<ReactionEvent>();
  public reactionReceived$: Observable<ReactionEvent> = this.reactionSource.asObservable();

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

    // Listen for typing events
    this.hubConnection.on('UserTyping', (userName: string, isTyping: boolean) => {
      this.typingSource.next({ user: userName, isTyping });
    });

    // Listen for reaction broadcast event from backend (ReceiveReaction)
    this.hubConnection.on('ReceiveReaction', (data: any) => {
      console.log('ReceiveReaction received:', data);
      if (data) {
        this.reactionSource.next({
          messageId: data.messageId,
          userId: data.userId,
          userName: data.userName,
          emoji: data.emoji,
          isRemoved: data.isRemoved ?? false
        });
      }
    });

    // Listen for incoming messages
    this.hubConnection.on('ReceiveMessage', (...args: any[]) => {
      console.log('ReceiveMessage event args received:', args);
      let id: any = null;
      let senderId = '';
      let senderName = '';
      let content = '';
      let timestamp = '';

      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        const msgObj = args[0];
        id = msgObj.id || msgObj.Id || Date.now();
        senderId = msgObj.senderId || msgObj.sender || '';
        senderName = msgObj.senderName || msgObj.senderUserName || msgObj.userName || '';
        content = msgObj.content || msgObj.message || '';
        timestamp = msgObj.timestamp || '';
      } else if (args.length === 4) {
        const [msgId, name, msgContent, msgTimestamp] = args;
        id = msgId;
        senderId = name;
        senderName = name;
        content = msgContent;
        timestamp = msgTimestamp;
      } else {
        const [senderNameOrId, msgContent, msgTimestamp] = args;
        senderId = senderNameOrId;
        senderName = senderNameOrId;
        content = msgContent;
        timestamp = msgTimestamp;
      }

      this.messageSource.next({ 
        id: id || Date.now(),
        user: senderName || senderId, 
        userId: senderId, 
        message: content, 
        timestamp, 
        isIncoming: true,
        reactions: []
      });
    });
  }

  public startConnection() {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      this.hubConnection.start()
        .then(() => console.log('SignalR connected successfully on demand!'))
        .catch(err => console.error('SignalR manual connection failed:', err));
    }
  }

  // Invokes SendReaction on the Hub
  public sendReaction(messageId: number | string, emoji: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('SendReaction', Number(messageId), emoji)
        .catch(err => console.error('Error while invoking SendReaction: ', err));
    }
    return Promise.resolve();
  }

  public sendMessage(message: string): Promise<void> {
    return this.hubConnection.invoke('SendMessage', message)
      .catch(err => console.error('Error while sending message: ', err));
  }

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

  public startTyping(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('StartTyping')
        .catch(err => console.error('Error while sending StartTyping: ', err));
    }
    return Promise.resolve();
  }

  public stopTyping(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('StopTyping')
        .catch(err => console.error('Error while sending StopTyping: ', err));
    }
    return Promise.resolve();
  }
}