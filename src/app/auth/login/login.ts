import { Component, ChangeDetectorRef, Inject, NgZone, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { ChatService } from '../../components/chat-widget/chat.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  currentStep: number = 1; // 1 = Login form, 2 = OTP Verification
  passwordType: string = 'password';
  isPasswordHidden: boolean = true;
  activeIndex = 0;
  private slideshowInterval: any;

  phone: string = '';
  password: string = '';
  userId: string = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  maskedEmail: string = '';

  isLoading: boolean = false;
  errorMessage: string = '';

  currentLang: LangCode = 'ar';

  translations = {
    ar: {
      langLabel: 'English',
      loginTitle: 'تسجيل الدخول',
      mobileLabel: 'رقم الجوال',
      mobilePlaceholder: '5xxxxxxxx',
      passwordLabel: 'كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
      loginButton: 'تسجيل الدخول',
      loadingButton: 'جاري الدخول...',
      genericError: 'حدث خطأ، حاول مرة أخرى',
      credentialError: 'رقم الجوال أو الرقم السري غير صحيح!',
      otpTitle: 'رمز التحقق (OTP)',
      otpSubtitle: 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني',
      confirmBtn: 'تأكيد الرمز',
      confirmingBtn: 'جاري التأكيد...',
      invalidOtpError: 'يرجى إدخال رمز التحقق بالكامل (6 أرقام)',
      slides: [
        {
          title: 'تحكم في كل مشروع من مكان واحد',
          desc: 'تابع الأداء، وزّع المسؤوليات، وحافظ على انسجام كل مراحل العمل بكفاءة.',
          image: 'assets/login_illustration1.png'
        },
        {
          title: 'التخطيط والتحكم والتنفيذ بفعالية',
          desc: 'إدارة خطط المشاريع والاعتمادات وسير العمل التشغيلي من خلال نظام موحد.',
          image: 'assets/login_illustration2.png'
        },
        {
          title: 'ابقِ المواعيد النهائية تحت السيطرة',
          desc: 'مراقبة الجداول الزمنية، المهام المتأخرة، ومحطات المشاريع قبل أن تؤثر على التسليم.',
          image: 'assets/login_illustration3.png'
        }
      ]
    },
    en: {
      langLabel: 'العربية',
      loginTitle: 'Login',
      mobileLabel: 'Mobile Number',
      mobilePlaceholder: '5xxxxxxxx',
      passwordLabel: 'Password',
      forgotPassword: 'Forgot Password?',
      loginButton: 'Login',
      loadingButton: 'Logging in...',
      genericError: 'Something went wrong, please try again',
      credentialError: 'Incorrect phone number or password!',
      otpTitle: 'Verification Code (OTP)',
      otpSubtitle: 'Enter the verification code sent to your email',
      confirmBtn: 'Confirm',
      confirmingBtn: 'Confirming...',
      invalidOtpError: 'Please enter the full 6-digit verification code',
      slides: [
        {
          title: 'Control Every Project From One Place',
          desc: 'Track performance, assign responsibilities, and keep every workflow aligned efficiently.',
          image: 'assets/login_illustration1.png'
        },
        {
          title: 'Plan, Govern, And Execute Efficiently',
          desc: 'Manage project plans, approvals, and operational workflows through one unified system.',
          image: 'assets/login_illustration2.png'
        },
        {
          title: 'Keep Every Deadline Under Control',
          desc: 'Monitor timelines, delayed tasks, and project milestones before they impact delivery.',
          image: 'assets/login_illustration3.png'
        }
      ]
    }
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) {
        this.currentLang = savedLang;
      }
    }
    this.applyDirection();
  }

  ngOnInit() {
    this.startSlideshow();
  }

  ngOnDestroy() {
    this.stopSlideshow();
  }

  private startSlideshow() {
    this.slideshowInterval = setInterval(() => {
      this.activeIndex = (this.activeIndex + 1) % this.slides.length;
      this.cdr.detectChanges();
    }, 5000);
  }

  private stopSlideshow() {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
    }
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get slides() {
    return this.t.slides;
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  togglePassword() {
    this.isPasswordHidden = !this.isPasswordHidden;
    this.passwordType = this.isPasswordHidden ? 'password' : 'text';
    this.cdr.detectChanges();
  }

  changeLang() {
    this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('preferred_lang', this.currentLang);
    }
    this.applyDirection();
    this.cdr.detectChanges();
  }

  private applyDirection() {
    const html = this.document.documentElement;
    html.setAttribute('dir', this.isRtl ? 'rtl' : 'ltr');
    html.setAttribute('lang', this.currentLang);
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.phone = input.value;
  }

  // Handle single digit OTP entries
  onOtpDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val.length > 0) {
      val = val.substring(val.length - 1);
    }
    input.value = val;
    this.otpDigits[index] = val;

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
    this.cdr.detectChanges();
  }

  // Handle backspace navigation for OTP inputs
  onOtpKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          this.otpDigits[index - 1] = '';
          prevInput.select();
        }
      } else {
        this.otpDigits[index] = '';
      }
      this.cdr.detectChanges();
    }
  }

  goBack() {
    if (this.currentStep === 2) {
      this.currentStep = 1;
      this.errorMessage = '';
      this.otpDigits = ['', '', '', '', '', ''];
    }
    this.cdr.detectChanges();
  }

  // Step 1: Submit credentials
  onSubmit() {
    this.errorMessage = '';

    if (!this.phone || !this.password) {
      this.errorMessage = this.t.genericError;
      return;
    }

    this.isLoading = true;

    let formattedPhone = this.phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    const fullPhone = '+966' + formattedPhone;

    this.authService.login({ phone: fullPhone, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response && response.requiresTwoFactor) {
          this.userId = response.userId;
          
          const userEmail = response.email || '';
          if (userEmail.includes('@')) {
            const parts = userEmail.split('@');
            const name = parts[0];
            const domain = parts[1];
            const maskedName = name.length > 2 ? name.substring(0, 2) + '***' : name + '***';
            this.maskedEmail = `${maskedName}@${domain}`;
          } else {
            this.maskedEmail = userEmail;
          }

          this.currentStep = 2;
        } 
        else if (response && response.token) {
          this.authService.saveSession(response);
          this.chatService.startConnection();
          this.redirectToDashboard();
        } else {
          this.errorMessage = this.t.credentialError;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = this.t.credentialError;
        } else {
          this.errorMessage = this.t.genericError;
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Step 2: Confirm login OTP code
  confirmLoginOtp() {
    this.errorMessage = '';
    const code = this.otpDigits.join('');

    if (code.length < 6) {
      this.errorMessage = this.t.invalidOtpError;
      return;
    }

    this.isLoading = true;

    this.authService.verifyLogin2Fa(this.userId, code).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.token) {
          this.authService.saveSession(response);
          this.chatService.startConnection();
          this.redirectToDashboard();
        } else {
          this.errorMessage = this.t.genericError;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else {
          this.errorMessage = this.currentLang === 'ar' ? 'رمز التحقق غير صحيح أو انتهت صلاحيته!' : 'Invalid or expired verification code!';
        }
        this.cdr.detectChanges();
      }
    });
  }

  private redirectToDashboard() {
    this.ngZone.run(() => {
      this.router.navigate(['/dashboard']);
    });
  }
}