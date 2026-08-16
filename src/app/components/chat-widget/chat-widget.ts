import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import { Subscription } from 'rxjs';

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatMessage {
  id?: string;
  user: string;
  message: string;
  isIncoming: boolean;
  reactions?: Reaction[];
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

  // Emojis and reactions state
  showInputEmojiStrip = false;
  hoveredMessageIndex: number | null = null;
  readonly emojiList: string[] = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  
  messages: ChatMessage[] = [
    { user: 'Support', message: 'Hello! 👋 Need help tracking project milestones or updating a task status?', isIncoming: true, reactions: [] }
  ];

  isLocalTyping = false;
  typingTimeout: any;
  typingUsers = new Set<string>();

  private messageSub!: Subscription;
  private typingSub!: Subscription;

  constructor(
    private chatService: ChatService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.resolveCurrentUser();
    this.chatService.startConnection();
    this.loadHistory();

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
              ...data,
              reactions: data.reactions || []
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

  // Insert emoji into input text
  insertEmoji(emoji: string) {
    this.newMessage += emoji;
    this.onInputChange();
  }

  // Toggle reaction on a message
  toggleReaction(msg: ChatMessage, emoji: string) {
    if (!msg.reactions) {
      msg.reactions = [];
    }

    const userId = this.currentUserId || this.currentUser || 'me';
    const existing = msg.reactions.find(r => r.emoji === emoji);

    if (existing) {
      if (existing.users.includes(userId)) {
        existing.users = existing.users.filter(u => u !== userId);
        existing.count--;
        if (existing.count <= 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existing.users.push(userId);
        existing.count++;
      }
    } else {
      msg.reactions.push({
        emoji,
        count: 1,
        users: [userId]
      });
    }
  }

  loadHistory() {
    this.chatService.getChatHistory().subscribe({
      next: (history: any[]) => {
        if (history && Array.isArray(history)) {
          const mapped = history.map(msg => {
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
              user: senderName || senderId,
              message: msg.content || msg.message || '',
              isIncoming: !isFromSelf,
              reactions: msg.reactions || []
            };
          });
          this.messages = [
            { user: 'Support', message: 'Hello! 👋 Need help tracking project milestones or updating a task status?', isIncoming: true, reactions: [] },
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

  private resolveCurrentUser() {
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

  ngOnDestroy() {
    if (this.messageSub) this.messageSub.unsubscribe();
    if (this.typingSub) this.typingSub.unsubscribe();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendQuickMessage(text: string) {
    this.newMessage = text;
    this.sendMessage();
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    this.stopLocalTyping();
    const messageText = this.newMessage;
    
    this.messages.push({ user: this.currentUser, message: messageText, isIncoming: false, reactions: [] });
    this.newMessage = '';
    this.showInputEmojiStrip = false;
    setTimeout(() => this.scrollToBottom(), 50);

    this.chatService.sendMessage(messageText);
  }

  onInputChange() {
    if (!this.isLocalTyping) {
      this.isLocalTyping = true;
      this.chatService.startTyping();
    }
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopLocalTyping();
    }, 2000);
  }

  stopLocalTyping() {
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