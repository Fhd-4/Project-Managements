import { Component, ChangeDetectorRef, Inject, NgZone, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  passwordType: string = 'password';
  isPasswordHidden: boolean = true;
  activeIndex = 0;
  private slideshowInterval: any;

  phone: string = '';
  password: string = '';

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
      slides: [
        {
          title: 'تحكم في كل مشروع من مكان واحد',
          desc: 'تابع الأداء، وزّع المسؤوليات، وحافظ على انسجام كل مراحل العمل بكفاءة.',
          image: 'assets/illustration1.jpg'
        },
        {
          title: 'التخطيط والتحكم والتنفيذ بفعالية',
          desc: 'إدارة خطط المشاريع والاعتمادات وسير العمل التشغيلي من خلال نظام موحد.',
          image: 'assets/illustration.svg.png'
        },
        {
          title: 'ابقِ المواعيد النهائية تحت السيطرة',
          desc: 'مراقبة الجداول الزمنية، المهام المتأخرة، ومحطات المشاريع قبل أن تؤثر على التسليم.',
          image: 'assets/illustration3.jpg'
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
      slides: [
        {
          title: 'Control Every Project From One Place',
          desc: 'Track performance, assign responsibilities, and keep every workflow aligned efficiently.',
          image: 'assets/illustration1.jpg'
        },
        {
          title: 'Plan, Govern, And Execute Efficiently',
          desc: 'Manage project plans, approvals, and operational workflows through one unified system.',
          image: 'assets/illustration.svg.png'
        },
        {
          title: 'Keep Every Deadline Under Control',
          desc: 'Monitor timelines, delayed tasks, and project milestones before they impact delivery.',
          image: 'assets/illustration3.jpg'
        }
      ]
    }
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
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

  onSubmit() {
    this.errorMessage = '';

    if (!this.phone || !this.password) {
      this.errorMessage = this.t.genericError;
      return;
    }

    this.isLoading = true;

    // Remove leading zero or whitespace
    let formattedPhone = this.phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    // Prepend country code
    const fullPhone = '+966' + formattedPhone;

    this.authService.login({ phone: fullPhone, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response && response.token) {
          this.authService.saveSession(response);
          
          this.ngZone.run(() => {
            this.router.navigate(['/dashboard']).then(
              (success) => console.log('Navigation success:', success),
              (error) => console.log('Navigation error:', error)          
            );
          });
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
}
