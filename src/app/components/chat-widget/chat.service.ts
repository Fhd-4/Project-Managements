import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_CONFIG } from '../../api.config';

export interface OnlineUserDto {
  userId: string;
  userName: string;
  profilePhoto?: string;
  isOnline: boolean;
  lastSeenUtc?: string | null;
  lastActivityUtc?: string | null;
}

export interface UserStatusEvent {
  userId: string;
  isOnline: boolean;
}

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

  private userStatusSource = new Subject<UserStatusEvent>();
  public userStatusChanged$: Observable<UserStatusEvent> = this.userStatusSource.asObservable();

  private audioCtx: AudioContext | null = null;

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

    this.hubConnection.on('UserStatusChanged', (...args: any[]) => {
      let userId = '';
      let isOnline = false;

      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        userId = args[0].userId || args[0].id || '';
        isOnline = !!args[0].isOnline;
      } else if (args.length >= 2) {
        userId = String(args[0]);
        isOnline = Boolean(args[1]);
      }

      if (userId) {
        this.userStatusSource.next({ userId, isOnline });
      }
    });

    this.hubConnection.on('UserTyping', (userName: string, isTyping: boolean) => {
      this.typingSource.next({ user: userName, isTyping });
    });

    this.hubConnection.on('ReceiveReaction', (data: any) => {
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

    this.hubConnection.on('ReceiveMessage', (...args: any[]) => {
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

  public playNotificationSound(): void {
    if (typeof window === 'undefined') return;

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio notification error:', e);
    }
  }

  public startConnection() {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      this.hubConnection.start()
        .then(() => console.log('SignalR connected successfully!'))
        .catch(err => console.error('SignalR manual connection failed:', err));
    }
  }

  public getOnlineUsers(): Observable<OnlineUserDto[]> {
    let token = '';
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('auth_token') || '';
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<OnlineUserDto[]>(`${API_CONFIG.baseUrl}/Chat/online-users`, { headers });
  }

  public sendReaction(messageId: number | string, emoji: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('SendReaction', Number(messageId), emoji)
        .catch(err => console.error('Error sending reaction: ', err));
    }
    return Promise.resolve();
  }

  public sendMessage(message: string): Promise<void> {
    return this.hubConnection.invoke('SendMessage', message)
      .catch(err => console.error('Error sending message: ', err));
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
        .catch(err => console.error('Error sending StartTyping: ', err));
    }
    return Promise.resolve();
  }

  public stopTyping(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('StopTyping')
        .catch(err => console.error('Error sending StopTyping: ', err));
    }
    return Promise.resolve();
  }
}