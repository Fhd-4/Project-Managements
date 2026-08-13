import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service'; // تأكدي من مسار الخدمة الصحيح
import { Subscription } from 'rxjs';

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
  currentUser = 'Yousra'; // يمكنك استبداله باسم المستخدم الحالي أو الـ ID
  
  messages: Array<{ user: string, message: string, isIncoming: boolean }> = [
    { user: 'Support', message: 'Hello! 👋 Need help tracking project milestones or updating a task status?', isIncoming: true }
  ];

  currentUserId = '';

  private messageSub!: Subscription;

  constructor(private chatService: ChatService, private ngZone: NgZone) {}

  ngOnInit() {
    this.resolveCurrentUser();
    this.chatService.startConnection();

    // استقبال الرسائل الحية عند حدوث الـ Event (ReceiveMessage)
    this.messageSub = this.chatService.currentMessage$.subscribe(data => {
      if (data) {
        // منع تكرار الرسالة الصادرة من المرسل نفسه (لأنها تضاف محلياً فور الإرسال)
        const isFromSelf = data.user.trim().toLowerCase() === this.currentUserId.trim().toLowerCase() ||
                           data.user.trim().toLowerCase() === this.currentUser.trim().toLowerCase();
        if (!isFromSelf) {
          this.ngZone.run(() => {
            this.messages.push(data);
            setTimeout(() => this.scrollToBottom(), 50);
          });
        }
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
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
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

    const messageText = this.newMessage;
    
    // إضافتها محلياً للشاشة فوراً دون انتظار رد السيرفر لمنع تأخر الاستجابة
    this.messages.push({ user: this.currentUser, message: messageText, isIncoming: false });
    this.newMessage = '';
    setTimeout(() => this.scrollToBottom(), 50);

    // إرسال الرسالة للباك إند بالخلفية (الشات الجماعي يتطلب الرسالة فقط)
    this.chatService.sendMessage(messageText);
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}