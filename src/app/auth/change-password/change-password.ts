import { Component, ChangeDetectorRef, Inject, NgZone, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss'
})
export class ChangePasswordComponent implements OnInit {
  phone: string = '';
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  isCurrentPasswordHidden: boolean = true;
  isNewPasswordHidden: boolean = true;
  isConfirmPasswordHidden: boolean = true;

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  currentLang: LangCode = 'ar';

  translations = {
    ar: {
      langLabel: 'English',
      title: 'تغيير كلمة المرور',
      subtitle: 'أدخل كلمة المرور القديمة ثم الجديدة لإتمام تغيير الرقم السري بنجاح.',
      phoneLabel: 'رقم الجوال',
      currentPasswordLabel: 'كلمة المرور الحالية',
      newPasswordLabel: 'كلمة المرور الجديدة',
      confirmPasswordLabel: 'تأكيد كلمة المرور الجديدة',
      saveBtn: 'حفظ كلمة المرور الجديدة',
      savingBtn: 'جاري الحفظ...',
      cancelBtn: 'إلغاء التغيير',
      passwordMismatchError: 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين!',
      passwordLengthError: 'كلمة المرور يجب ألا تقل عن 6 خانات',
      genericError: 'حدث خطأ أثناء تغيير كلمة المرور، يرجى المحاولة مرة أخرى',
      successMessage: 'تم تغيير كلمة المرور بنجاح! سيتم إرجاعك لصفحة المستخدمين...'
    },
    en: {
      langLabel: 'العربية',
      title: 'Change Password',
      subtitle: 'Enter your current password and new password to update your credentials.',
      phoneLabel: 'Phone Number',
      currentPasswordLabel: 'Current Password',
      newPasswordLabel: 'New Password',
      confirmPasswordLabel: 'Confirm New Password',
      saveBtn: 'Save New Password',
      savingBtn: 'Saving...',
      cancelBtn: 'Cancel',
      passwordMismatchError: 'New password and confirmation do not match!',
      passwordLengthError: 'Password must be at least 6 characters long',
      genericError: 'An error occurred while changing password, please try again',
      successMessage: 'Password changed successfully! Returning you to users...'
    }
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
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

  ngOnInit(): void {
    // Read phone from query parameters
    this.route.queryParams.subscribe(params => {
      if (params['phone']) {
        this.phone = params['phone'];
      }
      this.cdr.detectChanges();
    });
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

  togglePasswordVisibility(type: 'current' | 'new' | 'confirm') {
    if (type === 'current') {
      this.isCurrentPasswordHidden = !this.isCurrentPasswordHidden;
    } else if (type === 'new') {
      this.isNewPasswordHidden = !this.isNewPasswordHidden;
    } else {
      this.isConfirmPasswordHidden = !this.isConfirmPasswordHidden;
    }
    this.cdr.detectChanges();
  }

  goBack() {
    this.ngZone.run(() => {
      this.router.navigate(['/users']);
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.phone || !this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = this.t.genericError;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = this.t.passwordMismatchError;
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = this.t.passwordLengthError;
      return;
    }

    this.isLoading = true;

    this.authService.changePassword(this.phone, this.currentPassword, this.newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = this.t.successMessage;
        this.cdr.detectChanges();

        // Redirect back to users list or dashboard after 3 seconds
        setTimeout(() => {
          this.ngZone.run(() => {
            this.router.navigate(['/users']);
          });
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else if (err.error && Array.isArray(err.error)) {
          this.errorMessage = err.error[0].description || this.t.genericError;
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = this.t.genericError;
        }
        this.cdr.detectChanges();
      }
    });
  }
}
