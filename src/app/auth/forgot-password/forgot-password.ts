import { Component, ChangeDetectorRef, Inject, NgZone } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordComponent {
  currentStep: number = 1; // 1 = Email request, 2 = OTP code, 3 = Reset password
  email: string = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  newPassword: string = '';
  confirmPassword: string = '';

  isPasswordHidden: boolean = true;
  isConfirmPasswordHidden: boolean = true;

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  generatedOtp: string = ''; // Saved OTP code returned from API
  maskedEmail: string = '';
  
  currentLang: LangCode = 'ar';

  translations = {
    ar: {
      langLabel: 'English',
      forgotTitle: 'نسيت كلمة المرور',
      forgotSubtitle: 'أدخل بريدك الإلكتروني لتلقي رمز التحقق وإعادة تعيين كلمة المرور الخاصة بك بأمان.',
      mobileLabel: 'البريد الإلكتروني',
      mobilePlaceholder: 'name@example.com',
      sendOtpBtn: 'إرسال الرمز',
      sendingOtpBtn: 'جاري الإرسال...',
      
      otpTitle: 'رمز التحقق (OTP)',
      otpSubtitle: 'أدخل رمز التحقق المرسل إلى البريد الإلكتروني',
      confirmBtn: 'تأكيد الرمز',
      confirmingBtn: 'جاري التأكيد...',

      resetTitle: 'إعادة تعيين كلمة المرور',
      resetSubtitle: 'أدخل كلمة المرور الجديدة وقم بتأكيدها مرة أخرى',
      newPasswordLabel: 'كلمة المرور الجديدة',
      confirmPasswordLabel: 'تأكيد كلمة المرور الجديدة',
      resetBtn: 'تعديل كلمة المرور',
      resettingBtn: 'جاري التعديل...',

      invalidEmailError: 'البريد الإلكتروني غير صحيح! يرجى إدخال بريد إلكتروني صالح.',
      passwordMismatchError: 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين!',
      genericError: 'حدث خطأ، حاول مرة أخرى',
      successMessage: 'تمت إعادة تعيين كلمة المرور بنجاح! سيتم توجيهك لصفحة تسجيل الدخول...',
      otpAlert: 'رمز التحقق للتجربة والاختبار هو: ',
      backToLogin: 'العودة لتسجيل الدخول'
    },
    en: {
      langLabel: 'العربية',
      forgotTitle: 'Forget Password',
      forgotSubtitle: 'Enter your email address to receive a verification code and securely reset your password.',
      mobileLabel: 'Email Address',
      mobilePlaceholder: 'name@example.com',
      sendOtpBtn: 'Send OTP',
      sendingOtpBtn: 'Sending OTP...',
      
      otpTitle: 'Verification Code (OTP)',
      otpSubtitle: 'Enter the verification code sent to',
      confirmBtn: 'Confirm',
      confirmingBtn: 'Confirming...',

      resetTitle: 'Reset Password',
      resetSubtitle: 'Enter your new password and confirm it again',
      newPasswordLabel: 'New Password',
      confirmPasswordLabel: 'Confirm New Password',
      resetBtn: 'Next',
      resettingBtn: 'Updating...',

      invalidEmailError: 'Invalid email address! Please enter a valid email.',
      passwordMismatchError: 'New password and confirm password do not match!',
      genericError: 'Something went wrong, please try again',
      successMessage: 'Password reset successfully! Redirecting you to login...',
      otpAlert: 'The verification OTP code for testing is: ',
      backToLogin: 'Back to Login'
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

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
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

  // Handle single digit OTP entries
  onOtpDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    
    // Keep only the last character entered
    if (val.length > 0) {
      val = val.substring(val.length - 1);
    }
    
    input.value = val;
    this.otpDigits[index] = val;

    if (val && index < 5) {
      // Focus next input box
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
        // Focus previous input box and clear it
        const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          this.otpDigits[index - 1] = '';
          prevInput.select();
        }
      } else {
        // Clear current value
        this.otpDigits[index] = '';
      }
      this.cdr.detectChanges();
    }
  }

  togglePasswordVisibility(type: 'new' | 'confirm') {
    if (type === 'new') {
      this.isPasswordHidden = !this.isPasswordHidden;
    } else {
      this.isConfirmPasswordHidden = !this.isConfirmPasswordHidden;
    }
    this.cdr.detectChanges();
  }

  goBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    } else {
      this.ngZone.run(() => {
        this.router.navigate(['/auth/login']);
      });
    }
    this.cdr.detectChanges();
  }

  // STEP 1: Send OTP to email
  sendOtp() {
    this.errorMessage = '';

    if (!this.email || !this.email.includes('@')) {
      this.errorMessage = this.t.invalidEmailError;
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Save the OTP token returned by ASP.NET Identity (for testing)
        if (response && response.token) {
          this.generatedOtp = response.token;

          // Mask email for display (e.g. j***@example.com)
          const parts = this.email.trim().split('@');
          const name = parts[0];
          const domain = parts[1];
          const maskedName = name.length > 2 ? name.substring(0, 2) + '***' : name + '***';
          this.maskedEmail = `${maskedName}@${domain}`;

          // Transition to OTP verification step
          this.currentStep = 2;
        } else {
          this.errorMessage = this.t.genericError;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (err.status === 404) {
          this.errorMessage = this.currentLang === 'ar' ? 'هذا البريد الإلكتروني غير مسجل لدينا!' : 'This email address is not registered!';
        } else {
          this.errorMessage = this.t.genericError;
        }
        this.cdr.detectChanges();
      }
    });
  }

  // STEP 2: Verify OTP code
  confirmOtp() {
    this.errorMessage = '';
    const code = this.otpDigits.join('');

    if (code.length < 6) {
      this.errorMessage = this.currentLang === 'ar' ? 'يرجى إدخال رمز التحقق بالكامل (6 أرقام)' : 'Please enter the full 6-digit verification code';
      return;
    }

    // Verify token locally or check against generatedOtp
    if (code !== this.generatedOtp) {
      this.errorMessage = this.currentLang === 'ar' ? 'رمز التحقق غير صحيح!' : 'Incorrect verification code!';
      return;
    }

    // Transition to step 3 (reset password)
    this.currentStep = 3;
    this.cdr.detectChanges();
  }

  // STEP 3: Save new password
  resetPassword() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = this.t.genericError;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = this.t.passwordMismatchError;
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = this.currentLang === 'ar' ? 'كلمة المرور يجب ألا تقل عن 6 خانات' : 'Password must be at least 6 characters';
      return;
    }

    this.isLoading = true;

    const otpCode = this.otpDigits.join('');

    this.authService.resetPassword(this.email.trim(), otpCode, this.newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = this.t.successMessage;
        this.cdr.detectChanges();

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.ngZone.run(() => {
            this.router.navigate(['/auth/login']);
          });
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else if (err.error && Array.isArray(err.error)) {
          // If Identity returns validation errors
          this.errorMessage = err.error[0].description || this.t.genericError;
        } else {
          this.errorMessage = this.t.genericError;
        }
        this.cdr.detectChanges();
      }
    });
  }
}
