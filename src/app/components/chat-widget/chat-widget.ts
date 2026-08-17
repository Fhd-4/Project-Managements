import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ReactionEvent, UserListItem, UserStatusEvent } from './chat.service';
import { Subscription } from 'rxjs';

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatMessage {
  id?: number | string;
  user: string;
  userId?: string;
  message: string;
  isIncoming: boolean;
  timestamp?: string;
  reactions: ReactionGroup[];
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.html',
  styleUrls: ['./chat-widget.scss']
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  newMessage = '';
  currentUser = 'Yousra';
  currentUserId = '';

  showInputEmojiStrip = false;
  hoveredMessageIndex: number | null = null;
  private hoverLeaveTimeout: any;

  readonly emojiList: string[] = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  
  messages: ChatMessage[] = [
    { id: 0, user: 'Support', message: 'Hello! 👋 Need help tracking project milestones or updating a task status?', isIncoming: true, reactions: [] }
  ];

  usersList: UserListItem[] = [];
  onlineUserIds = new Set<string>();

  isLocalTyping = false;
  typingTimeout: any;
  typingUsers = new Set<string>();

  private messageSub!: Subscription;
  private typingSub!: Subscription;
  private reactionSub!: Subscription;
  private statusSub!: Subscription;

  constructor(
    private chatService: ChatService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resolveCurrentUser();
    this.chatService.startConnection();
    this.loadUsers();
    this.loadHistory();

    // 1. Receive incoming messages
    this.messageSub = this.chatService.currentMessage$.subscribe(data => {
      if (data) {
        const senderIdStr = String(data.userId || data.user || '').trim().toLowerCase();
        const currentUserIdStr = String(this.currentUserId || '').trim().toLowerCase();
        const currentUserStr = String(this.currentUser || '').trim().toLowerCase();
        
        const isFromSelf = (senderIdStr && currentUserIdStr && senderIdStr === currentUserIdStr) ||
                           (senderIdStr && currentUserStr && senderIdStr === currentUserStr);
        if (!isFromSelf) {
          this.ngZone.run(() => {
            this.messages.push({
              id: data.id || Date.now(),
              user: data.user,
              userId: data.userId,
              message: data.message,
              isIncoming: true,
              reactions: []
            });

            this.chatService.playNotificationSound();

            this.cdr.detectChanges();
            setTimeout(() => {
              this.scrollToBottom();
              this.cdr.detectChanges();
            }, 50);
          });
        }
      }
    });

    // 2. Receive live SignalR reaction events
    this.reactionSub = this.chatService.reactionReceived$.subscribe((res: ReactionEvent) => {
      if (res) {
        this.ngZone.run(() => {
          this.handleLiveReaction(res);
          this.cdr.detectChanges();
        });
      }
    });

    // 3. Receive live User Online/Offline status changes
    this.statusSub = this.chatService.userStatusChanged$.subscribe((status: UserStatusEvent) => {
      if (status) {
        this.ngZone.run(() => {
          const targetId = status.userId.toLowerCase();
          const user = this.usersList.find(u => u.id.toLowerCase() === targetId);
          if (user) {
            user.isOnline = status.isOnline;
          }

          if (status.isOnline) {
            this.onlineUserIds.add(targetId);
            if (user?.userName) this.onlineUserIds.add(user.userName.toLowerCase());
            if (user?.nameAr) this.onlineUserIds.add(user.nameAr.toLowerCase());
          } else {
            this.onlineUserIds.delete(targetId);
            if (user?.userName) this.onlineUserIds.delete(user.userName.toLowerCase());
            if (user?.nameAr) this.onlineUserIds.delete(user.nameAr.toLowerCase());
          }

          this.cdr.detectChanges();
        });
      }
    });

    // 4. Typing indicator events
    this.typingSub = this.chatService.typingStatus$.subscribe(data => {
      if (data) {
        this.ngZone.run(() => {
          const userStr = String(data.user || '').trim().toLowerCase();
          const currentUserStr = String(this.currentUser || '').trim().toLowerCase();
          if (userStr !== currentUserStr) {
            if (data.isTyping) {
              this.typingUsers.add(data.user);
            } else {
              this.typingUsers.delete(data.user);
            }
            this.cdr.detectChanges();
            setTimeout(() => this.scrollToBottom(), 50);
          }
        });
      }
    });
  }

  loadUsers(): void {
    this.chatService.getAllUsers().subscribe({
      next: (users) => {
        if (users && Array.isArray(users)) {
          this.usersList = users;
          this.onlineUserIds.clear();
          users.forEach(u => {
            if (u.isOnline) {
              if (u.id) this.onlineUserIds.add(u.id.toLowerCase());
              if (u.userName) this.onlineUserIds.add(u.userName.toLowerCase());
              if (u.nameAr) this.onlineUserIds.add(u.nameAr.toLowerCase());
              if (u.nameEn) this.onlineUserIds.add(u.nameEn.toLowerCase());
            }
          });
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Failed to load users list:', err)
    });
  }

  getOnlineCount(): number {
    return this.usersList.filter(u => u.isOnline).length;
  }

  isUserOnline(userIdOrName?: string): boolean {
    if (!userIdOrName) return false;
    const key = String(userIdOrName).trim().toLowerCase();
    return this.onlineUserIds.has(key);
  }

  onMessageMouseEnter(index: number): void {
    clearTimeout(this.hoverLeaveTimeout);
    this.hoveredMessageIndex = index;
  }

  onMessageMouseLeave(): void {
    clearTimeout(this.hoverLeaveTimeout);
    this.hoverLeaveTimeout = setTimeout(() => {
      this.hoveredMessageIndex = null;
      this.cdr.detectChanges();
    }, 400);
  }

  toggleReaction(msg: ChatMessage, emoji: string): void {
    if (!msg.id || msg.id === 0) return;
    this.chatService.sendReaction(msg.id, emoji);
  }

  private handleLiveReaction(event: ReactionEvent): void {
    const msg = this.messages.find(m => String(m.id) === String(event.messageId));
    if (!msg) return;

    if (!msg.reactions) {
      msg.reactions = [];
    }

    msg.reactions.forEach(group => {
      group.users = group.users.filter(u => u !== event.userId);
      group.count = group.users.length;
    });

    if (!event.isRemoved) {
      const existingGroup = msg.reactions.find(g => g.emoji === event.emoji);
      if (existingGroup) {
        if (!existingGroup.users.includes(event.userId)) {
          existingGroup.users.push(event.userId);
          existingGroup.count = existingGroup.users.length;
        }
      } else {
        msg.reactions.push({
          emoji: event.emoji,
          count: 1,
          users: [event.userId]
        });
      }
    }

    msg.reactions = msg.reactions.filter(g => g.count > 0);
  }

  private formatReactionsFromHistory(rawReactions: any[]): ReactionGroup[] {
    if (!rawReactions || !Array.isArray(rawReactions)) return [];

    const groupMap = new Map<string, string[]>();

    rawReactions.forEach(r => {
      if (r.emoji) {
        const users = groupMap.get(r.emoji) || [];
        if (r.userId && !users.includes(r.userId)) {
          users.push(r.userId);
        }
        groupMap.set(r.emoji, users);
      }
    });

    const groups: ReactionGroup[] = [];
    groupMap.forEach((users, emoji) => {
      groups.push({
        emoji,
        count: users.length,
        users
      });
    });

    return groups;
  }

  loadHistory(): void {
    this.chatService.getChatHistory().subscribe({
      next: (history: any[]) => {
        if (history && Array.isArray(history)) {
          const mapped: ChatMessage[] = history.map(msg => {
            const senderName = String(msg.senderName || msg.senderUserName || msg.userName || '').trim();
            const senderId = String(msg.senderId || msg.sender || msg.user || '').trim();
            
            const senderNameLower = senderName.toLowerCase();
            const senderIdLower = senderId.toLowerCase();
            const currentUserIdLower = String(this.currentUserId || '').trim().toLowerCase();
            const currentUserLower = String(this.currentUser || '').trim().toLowerCase();

            const isFromSelf = (senderIdLower && currentUserIdLower && senderIdLower === currentUserIdLower) ||
                               (senderNameLower && currentUserLower && senderNameLower === currentUserLower) ||
                               (senderIdLower && currentUserLower && senderIdLower === currentUserLower);
            
            return {
              id: msg.id ?? msg.Id,
              user: senderName || senderId,
              userId: senderId,
              message: msg.content ?? msg.message ?? '',
              isIncoming: !isFromSelf,
              timestamp: msg.timestamp ?? '',
              reactions: this.formatReactionsFromHistory(msg.reactions ?? msg.Reactions)
            };
          });

          this.messages = [
            { id: 0, user: 'Support', message: 'Hello! 👋 Need help tracking project milestones or updating a task status?', isIncoming: true, reactions: [] },
            ...mapped
          ];
          this.cdr.detectChanges();
          setTimeout(() => {
            this.scrollToBottom();
            this.cdr.detectChanges();
          }, 100);
        }
      },
      error: (err) => {
        console.error('Failed to load chat history:', err);
      }
    });
  }

  private resolveCurrentUser(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.currentUserId = localStorage.getItem('auth_userId') || '';
      const savedUserName = localStorage.getItem('auth_userName');
      if (savedUserName) {
        this.currentUser = savedUserName;
      }

      if (!this.currentUserId) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.currentUserId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                                 payload.nameid || 
                                 payload.unique_name || 
                                 'yousra';
          } catch (e) {
            this.currentUserId = 'yousra';
          }
        } else {
          this.currentUserId = 'yousra';
        }
      }
    }
  }

  insertEmoji(emoji: string): void {
    this.newMessage += emoji;
    this.onInputChange();
  }

  ngOnDestroy(): void {
    if (this.hoverLeaveTimeout) clearTimeout(this.hoverLeaveTimeout);
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    if (this.messageSub) this.messageSub.unsubscribe();
    if (this.typingSub) this.typingSub.unsubscribe();
    if (this.reactionSub) this.reactionSub.unsubscribe();
    if (this.statusSub) this.statusSub.unsubscribe();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadUsers();
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendQuickMessage(text: string): void {
    this.newMessage = text;
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    this.stopLocalTyping();
    const messageText = this.newMessage;
    
    this.messages.push({ 
      id: Date.now(), 
      user: this.currentUser, 
      userId: this.currentUserId,
      message: messageText, 
      isIncoming: false, 
      reactions: [] 
    });
    
    this.newMessage = '';
    this.showInputEmojiStrip = false;
    setTimeout(() => this.scrollToBottom(), 50);

    this.chatService.sendMessage(messageText);
  }

  onInputChange(): void {
    if (!this.isLocalTyping) {
      this.isLocalTyping = true;
      this.chatService.startTyping();
    }
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopLocalTyping();
    }, 2000);
  }

  stopLocalTyping(): void {
    if (this.isLocalTyping) {
      this.isLocalTyping = false;
      this.chatService.stopTyping();
    }
  }

  getCurrentLang(): 'ar' | 'en' {
    if (typeof window !== 'undefined' && window.localStorage) {
      return (localStorage.getItem('preferred_lang') as 'ar' | 'en') || 'ar';
    }
    return 'ar';
  }

  getTypingText(): string {
    const isAr = this.getCurrentLang() === 'ar';
    const usersArray = Array.from(this.typingUsers);
    if (usersArray.length === 0) return '';

    if (isAr) {
      if (usersArray.length === 1) {
        return `${usersArray[0]} يكتب الآن`;
      } else if (usersArray.length === 2) {
        return `${usersArray[0]} و ${usersArray[1]} يكتبان الآن`;
      } else {
        return 'عدة أشخاص يكتبون الآن';
      }
    } else {
      if (usersArray.length === 1) {
        return `${usersArray[0]} is typing`;
      } else if (usersArray.length === 2) {
        return `${usersArray[0]} and ${usersArray[1]} are typing`;
      } else {
        return 'Multiple people are typing';
      }
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}