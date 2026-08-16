import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ReactionEvent } from './chat.service';
import { Subscription } from 'rxjs';

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[]; // List of user IDs
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

  isLocalTyping = false;
  typingTimeout: any;
  typingUsers = new Set<string>();

  private messageSub!: Subscription;
  private typingSub!: Subscription;
  private reactionSub!: Subscription;

  constructor(
    private chatService: ChatService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resolveCurrentUser();
    this.chatService.startConnection();
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
            this.cdr.detectChanges();
            setTimeout(() => {
              this.scrollToBottom();
              this.cdr.detectChanges();
            }, 50);
          });
        }
      }
    });

    // 2. Receive live SignalR reaction event
    this.reactionSub = this.chatService.reactionReceived$.subscribe((res: ReactionEvent) => {
      if (res) {
        this.ngZone.run(() => {
          this.handleLiveReaction(res);
          this.cdr.detectChanges();
        });
      }
    });

    // 3. Receive typing indicator events
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

  // Invoked when clicking an emoji on a message
  toggleReaction(msg: ChatMessage, emoji: string): void {
    if (!msg.id || msg.id === 0) return;

    // Send to SignalR Hub
    this.chatService.sendReaction(msg.id, emoji);
  }

  // Processes the backend broadcast: handles adds, updates, and removals
  private handleLiveReaction(event: ReactionEvent): void {
    const msg = this.messages.find(m => String(m.id) === String(event.messageId));
    if (!msg) return;

    if (!msg.reactions) {
      msg.reactions = [];
    }

    // Remove user's previous reaction on this message (if any)
    msg.reactions.forEach(group => {
      group.users = group.users.filter(u => u !== event.userId);
      group.count = group.users.length;
    });

    // If it's not a complete removal, add user to target emoji group
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

    // Clean up empty reaction groups
    msg.reactions = msg.reactions.filter(g => g.count > 0);
  }

  // Transforms raw API reactions [{ userId, userName, emoji }] into aggregated groups
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
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
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
    
    // Add locally for instant UI feedback
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