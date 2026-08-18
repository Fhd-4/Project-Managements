import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ReactionEvent, OnlineUserDto, UserStatusEvent } from './chat.service';
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
  replyToMessage?: {
    id: number | string;
    senderName: string;
    content: string;
  };
  status?: number;
  readStates?: Array<{ userId: string; readAt: string; }>;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
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

  // File upload state variables
  selectedFile: File | null = null;
  uploadedFileUrl: string | null = null;
  uploadedFileName: string | null = null;
  uploadedFileType: string | null = null;
  isUploading = false;

  showInputEmojiStrip = false;
  hoveredMessageIndex: number | null = null;
  private hoverLeaveTimeout: any;

  readonly emojiList: string[] = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  
  messages: ChatMessage[] = [
    { id: 0, user: 'Support', message: 'Hello! 👋 Need help tracking project milestones or updating a task status?', isIncoming: true, reactions: [] }
  ];

  onlineUsersList: OnlineUserDto[] = [];
  onlineUserIds = new Set<string>();

  allProjectUsers: any[] = [];
  filteredUsers: any[] = [];
  showMentionsList = false;
  replyingToMessage: ChatMessage | null = null;
  
  // Message editing state variables
  editingMessage: ChatMessage | null = null;
  isEditingMode = false;

  isLocalTyping = false;
  typingTimeout: any;
  typingUsers = new Set<string>();

  private messageSub!: Subscription;
  private typingSub!: Subscription;
  private reactionSub!: Subscription;
  private statusSub!: Subscription;
  private readSub!: Subscription;
  private editSub!: Subscription;
  private deleteSub!: Subscription;

  constructor(
    private chatService: ChatService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resolveCurrentUser();
    this.chatService.startConnection();
    this.loadOnlineUsers();
    this.loadAllProjectUsers();
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
              replyToMessage: data.replyToMessage,
              status: data.status || 0,
              fileUrl: data.fileUrl,
              fileName: data.fileName,
              fileType: data.fileType,
              reactions: []
            });

            this.chatService.playNotificationSound();

            if (this.isOpen && data.id) {
              this.chatService.markMessageAsRead(Number(data.id));
            }

            this.cdr.detectChanges();
            setTimeout(() => {
              this.scrollToBottom();
              this.cdr.detectChanges();
            }, 50);
          });
        } else {
          this.ngZone.run(() => {
            // Find our temporary message and link it with the server-generated ID
            const tempMsg = this.messages
              .slice()
              .reverse()
              .find(m => !m.isIncoming && m.message === data.message && typeof m.id === 'number' && m.id > 1000000000000);
            
            if (tempMsg) {
              tempMsg.id = data.id;
              tempMsg.status = 1; // Delivered (2 checks)
              tempMsg.fileUrl = data.fileUrl;
              tempMsg.fileName = data.fileName;
              tempMsg.fileType = data.fileType;
            } else {
              // Fallback: if not found, push it
              this.messages.push({
                id: data.id,
                user: data.user,
                userId: data.userId,
                message: data.message,
                isIncoming: false,
                replyToMessage: data.replyToMessage,
                status: 1, // Delivered (2 checks)
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                fileType: data.fileType,
                reactions: []
              });
            }
            this.cdr.detectChanges();
          });
        }
      }
    });

    // 1b. Receive message read status changes
    this.readSub = this.chatService.readStatus$.subscribe(data => {
      if (data) {
        this.ngZone.run(() => {
          const msg = this.messages.find(m => m.id === data.messageId);
          if (msg) {
            msg.status = 2; // Read
            if (!msg.readStates) {
              msg.readStates = [];
            }
            if (!msg.readStates.some(r => r.userId === data.readerUserId)) {
              msg.readStates.push({
                userId: data.readerUserId,
                readAt: new Date().toISOString()
              });
            }
          }
          this.cdr.detectChanges();
        });
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
          const user = this.onlineUsersList.find(u => u.userId.toLowerCase() === targetId);
          if (user) {
            user.isOnline = status.isOnline;
          }

          if (status.isOnline) {
            this.onlineUserIds.add(targetId);
            if (user?.userName) this.onlineUserIds.add(user.userName.toLowerCase());
          } else {
            this.onlineUserIds.delete(targetId);
            if (user?.userName) this.onlineUserIds.delete(user.userName.toLowerCase());
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
    // 5. Receive live message edits
    this.editSub = this.chatService.messageEdited$.subscribe(data => {
      if (data) {
        this.ngZone.run(() => {
          const msg = this.messages.find(m => m.id !== undefined && String(m.id) === String(data.messageId));
          if (msg) {
            msg.message = data.content;
            msg.isEdited = true;
          }
          this.cdr.detectChanges();
        });
      }
    });

    // 6. Receive live message deletions
    this.deleteSub = this.chatService.messageDeleted$.subscribe(data => {
      if (data) {
        this.ngZone.run(() => {
          const msg = this.messages.find(m => m.id !== undefined && String(m.id) === String(data.messageId));
          if (msg) {
            msg.isDeleted = true;
            msg.fileUrl = undefined;
            msg.fileName = undefined;
            msg.fileType = undefined;
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadOnlineUsers(): void {
    this.chatService.getOnlineUsers().subscribe({
      next: (users: OnlineUserDto[]) => {
        if (users && Array.isArray(users)) {
          this.onlineUsersList = users;
          this.onlineUserIds.clear();
          users.forEach(u => {
            if (u.isOnline) {
              if (u.userId) this.onlineUserIds.add(u.userId.toLowerCase());
              if (u.userName) this.onlineUserIds.add(u.userName.toLowerCase());
            }
          });
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => console.error('Failed to load online users:', err)
    });
  }

  getOnlyActiveUsers(): OnlineUserDto[] {
    return this.onlineUsersList.filter(u => u.isOnline);
  }

  isUserOnline(userIdOrName?: string): boolean {
    if (!userIdOrName) return false;
    const key = String(userIdOrName).trim().toLowerCase();
    return this.onlineUserIds.has(key);
  }

  hasValidProfilePhoto(photoUrl?: string): boolean {
    return !!photoUrl && !photoUrl.includes('default-profile.png');
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
            
             const readStatesList = msg.readStates ?? msg.ReadStates ?? [];
             return {
               id: msg.id ?? msg.Id,
               user: senderName || senderId,
               userId: senderId,
               message: msg.content ?? msg.message ?? '',
               isIncoming: !isFromSelf,
               timestamp: msg.timestamp ?? '',
               status: readStatesList.length > 0 ? 2 : 1,
               replyToMessage: msg.replyToMessage,
               readStates: readStatesList,
               fileUrl: msg.fileUrl ?? msg.FileUrl ?? null,
               fileName: msg.fileName ?? msg.FileName ?? null,
               fileType: msg.fileType ?? msg.FileType ?? null,
               reactions: this.formatReactionsFromHistory(msg.reactions ?? msg.Reactions)
             };
          });

          this.messages = [
            { id: 0, user: 'Support', message: 'Hello! 👋 Need help tracking project milestones or updating a task status?', isIncoming: true, reactions: [] },
            ...mapped
          ];
            
            if (this.isOpen) {
              mapped.forEach(msg => {
                if (msg.isIncoming && msg.id && msg.status !== 2) {
                  this.chatService.markMessageAsRead(Number(msg.id));
                }
              });
            }

            this.cdr.detectChanges();
            setTimeout(() => {
              this.scrollToBottom();
              this.cdr.detectChanges();
            }, 100);
          }
        },
        error: (err: any) => {
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
    if (this.readSub) this.readSub.unsubscribe();
    if (this.editSub) this.editSub.unsubscribe();
    if (this.deleteSub) this.deleteSub.unsubscribe();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadOnlineUsers();
      this.messages.forEach(msg => {
        if (msg.isIncoming && msg.id && msg.status !== 2) {
          this.chatService.markMessageAsRead(Number(msg.id));
        }
      });
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(this.getCurrentLang() === 'ar' ? 'حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت)!' : 'File size exceeds maximum limit of 10 MB!');
      return;
    }

    this.selectedFile = file;
    this.isUploading = true;

    this.chatService.uploadFile(file).subscribe({
      next: (res) => {
        this.uploadedFileUrl = res.fileUrl;
        this.uploadedFileName = res.fileName;
        this.uploadedFileType = res.fileType;
        this.isUploading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('File upload failed', err);
        alert(this.getCurrentLang() === 'ar' ? 'فشل رفع الملف!' : 'File upload failed!');
        this.selectedFile = null;
        this.isUploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.uploadedFileUrl = null;
    this.uploadedFileName = null;
    this.uploadedFileType = null;
    this.isUploading = false;
    this.cdr.detectChanges();
  }

  sendQuickMessage(text: string): void {
    this.newMessage = text;
    this.sendMessage();
  }

  startEditingMessage(msg: ChatMessage): void {
    this.editingMessage = msg;
    this.isEditingMode = true;
    this.newMessage = msg.message;
    this.replyingToMessage = null;
    this.showInputEmojiStrip = false;
    this.cdr.detectChanges();
  }

  cancelEditingMessage(): void {
    this.editingMessage = null;
    this.isEditingMode = false;
    this.newMessage = '';
    this.cdr.detectChanges();
  }

  triggerDeleteMessage(msg: ChatMessage): void {
    if (!msg.id) return;
    const confirmMsg = this.getCurrentLang() === 'ar' ? 'هل تريد حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?';
    if (confirm(confirmMsg)) {
      this.chatService.deleteMessage(msg.id).subscribe({
        next: () => {
          this.ngZone.run(() => {
            msg.isDeleted = true;
            msg.fileUrl = undefined;
            msg.fileName = undefined;
            msg.fileType = undefined;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          console.error('Delete message failed', err);
        }
      });
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() && !this.uploadedFileUrl) return;

    this.stopLocalTyping();
    const messageText = this.newMessage;
    
    if (this.isEditingMode && this.editingMessage) {
      const msgId = this.editingMessage.id;
      if (msgId) {
        this.chatService.editMessage(msgId, messageText).subscribe({
          next: () => {
            this.ngZone.run(() => {
              if (this.editingMessage) {
                this.editingMessage.message = messageText;
                this.editingMessage.isEdited = true;
              }
              this.cancelEditingMessage();
            });
          },
          error: (err) => {
            console.error('Edit message failed', err);
          }
        });
      }
      return;
    }

    const replyId = this.replyingToMessage?.id;
    const fileUrl = this.uploadedFileUrl;
    const fileName = this.uploadedFileName;
    const fileType = this.uploadedFileType;
    
    this.messages.push({ 
      id: Date.now(), 
      user: this.currentUser, 
      userId: this.currentUserId,
      message: messageText, 
      isIncoming: false, 
      status: 0,
      replyToMessage: this.replyingToMessage ? {
        id: this.replyingToMessage.id!,
        senderName: this.replyingToMessage.user,
        content: this.replyingToMessage.message
      } : undefined,
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
      fileType: fileType || undefined,
      reactions: [] 
    });
    
    this.newMessage = '';
    this.showInputEmojiStrip = false;
    this.replyingToMessage = null;
    
    // Clear upload state
    this.selectedFile = null;
    this.uploadedFileUrl = null;
    this.uploadedFileName = null;
    this.uploadedFileType = null;
    this.isUploading = false;
    
    setTimeout(() => this.scrollToBottom(), 50);

    this.chatService.sendMessage(messageText, replyId !== undefined ? Number(replyId) : null, fileUrl, fileName, fileType);
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

    const lastAtWordMatch = this.newMessage.match(/@([a-zA-Z0-9_.\u0600-\u06FF]*)$/);
    if (lastAtWordMatch) {
      this.showMentionsList = true;
      const query = lastAtWordMatch[1].toLowerCase();
      this.filteredUsers = this.allProjectUsers.filter(u => {
        const name = (u.userName || u.nameAr || u.nameEn || '').toLowerCase();
        return name.includes(query);
      });
      this.filteredUsers.unshift({
        id: 'all',
        userName: 'الكل (all)',
        nameAr: 'الكل',
        nameEn: 'all'
      });
    } else {
      this.showMentionsList = false;
    }
  }

  loadAllProjectUsers(): void {
    this.chatService.getUsers().subscribe({
      next: (users) => {
        this.allProjectUsers = users || [];
      },
      error: (err) => console.error('Failed to load project users:', err)
    });
  }

  selectMention(user: any): void {
    const mentionText = user.id === 'all' ? '@الكل ' : `@${user.userName || user.nameAr || 'user'} `;
    const lastAtIndex = this.newMessage.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      this.newMessage = this.newMessage.substring(0, lastAtIndex) + mentionText;
    } else {
      this.newMessage += mentionText;
    }
    this.showMentionsList = false;
    this.filteredUsers = [];
  }

  initiateReply(msg: ChatMessage): void {
    this.replyingToMessage = msg;
    this.showInputEmojiStrip = false;
  }

  cancelReply(): void {
    this.replyingToMessage = null;
  }

  formatMessage(text: string): string {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
      
    escaped = escaped.replace(/@([a-zA-Z0-9_.\u0600-\u06FF\s()]+)/g, (match, username) => {
      const lowerName = username.trim().toLowerCase();
      if (lowerName === 'all' || lowerName === 'الكل' || lowerName.includes('all') || lowerName.includes('الكل')) {
        return `<span class="mention-tag all-mention">${match}</span>`;
      }
      return `<span class="mention-tag">${match}</span>`;
    });
    return escaped;
  }

  getReaderName(userId: string): string {
    const user = this.allProjectUsers.find(u => u.id === userId);
    return user ? (user.userName || user.nameAr || 'مستخدم') : 'مستخدم';
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