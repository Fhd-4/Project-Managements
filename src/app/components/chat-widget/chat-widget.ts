import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
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

  private messageSub!: Subscription;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    // استقبال الرسائل الحية عند حدوث الـ Event (ReceiveMessage)
    this.messageSub = this.chatService.currentMessage$.subscribe(data => {
      if (data) {
        this.messages.push(data);
        this.scrollToBottom();
      }
    });
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
    
    // إرسال الرسالة للباك إند باستخدام طريقة SendMessage
    this.chatService.sendMessage(this.currentUser, messageText).then(() => {
      // إضافتها محلياً للشاشة فوراً
      this.messages.push({ user: this.currentUser, message: messageText, isIncoming: false });
      this.newMessage = '';
      this.scrollToBottom();
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}