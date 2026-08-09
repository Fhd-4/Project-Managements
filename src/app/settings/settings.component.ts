import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, Category, Role } from './settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  activeTab: 'roles' | 'categories' | 'security' = 'roles';
  searchQuery = '';
  
  roles: Role[] = [];
  categories: Category[] = [];
  isTwoFactorEnabled: boolean = false;
  
  isAddRoleModalOpen = false;
  isAddCategoryModalOpen = false;
  isDeleteCategoryModalOpen = false;
  
  newRoleName = '';
  newCategoryName = '';
  newCategoryAssignTo = '';
  categoryToDelete: number | null = null;

  assignToOptions = ['Program', 'Portfolio', 'Project', 'Task'];

  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private settingsService: SettingsService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  }

  showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
  }

  switchTab(tab: 'roles' | 'categories' | 'security') {
    this.activeTab = tab;
    this.searchQuery = '';
    this.loadData();
  }

  loadData() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.activeTab === 'roles') {
        this.settingsService.getRoles().subscribe({
          next: (res) => { this.roles = res || []; this.cdr.detectChanges(); },
          error: (err) => { console.error('Failed to load roles:', err); this.roles = []; this.cdr.detectChanges(); }
        });
      } else if (this.activeTab === 'categories') {
        this.settingsService.getCategories(this.searchQuery).subscribe({
          next: (res) => { this.categories = res || []; this.cdr.detectChanges(); },
          error: (err) => { console.error('Failed to load categories:', err); this.categories = []; this.cdr.detectChanges(); }
        });
      } else if (this.activeTab === 'security') {
        // جلب حالة الـ 2FA الحالية للمستخدم من التخزين المحلي أو الـ API
        const userId = localStorage.getItem('auth_userId') || '';
        // افتراضياً يمكن جلب الحالة أو حفظها، وهنا نربطها بالتخزين أو حالة مبدئية
        this.isTwoFactorEnabled = localStorage.getItem('auth_2fa') === 'true';
        this.cdr.detectChanges();
      }
    }
  }

  // --- Toggle 2FA Action ---
  toggleTwoFactor(event: any) {
    const isChecked = event.target.checked;
    const userId = localStorage.getItem('auth_userId');

    if (!userId) {
      this.showError('User ID not found!');
      event.target.checked = !isChecked; // إعادة الزر لحالته السابقة
      return;
    }

    this.settingsService.toggle2Fa(userId, isChecked).subscribe({
      next: (res: any) => {
        this.isTwoFactorEnabled = isChecked;
        localStorage.setItem('auth_2fa', isChecked.toString());
        this.showSuccess(res.message || '2FA status updated successfully');
        this.cdr.detectChanges();
      },
      error: (err) => {
        event.target.checked = !isChecked; // إعادة الزر لحالته السابقة عند الفشل
        this.showError('Failed to update 2FA status');
      }
    });
  }

  onSearch() {
    this.loadData();
  }

  openCreateModal() {
    if (this.activeTab === 'roles') {
      this.newRoleName = '';
      this.isAddRoleModalOpen = true;
    } else {
      this.newCategoryName = '';
      this.newCategoryAssignTo = '';
      this.isAddCategoryModalOpen = true;
    }
  }

  saveRole() {
    if (!this.newRoleName.trim()) return;
    this.settingsService.createRole(this.newRoleName).subscribe({
      next: () => {
        this.isAddRoleModalOpen = false;
        this.loadData();
        this.showSuccess('Role added successfully');
      },
      error: (err) => {
        let msg = 'Fail to add role';
        if (err.error) {
           if (typeof err.error === 'string') msg = err.error;
           else if (err.error[0]?.description) msg = err.error[0].description;
           else if (err.error.message) msg = err.error.message;
        }
        this.showError(msg);
      }
    });
  }

  saveCategory() {
    if (!this.newCategoryName.trim() || !this.newCategoryAssignTo) return;
    const newCat: Category = { name: this.newCategoryName, assignTo: this.newCategoryAssignTo };
    this.settingsService.createCategory(newCat).subscribe({
      next: () => {
        this.isAddCategoryModalOpen = false;
        this.loadData();
        this.showSuccess('Category Added Successfully'); 
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error : 'Fail to added category';
        this.showError(msg);
      }
    });
  }

  confirmDeleteCategory(id: number) {
    this.categoryToDelete = id;
    this.isDeleteCategoryModalOpen = true;
  }

  deleteCategory() {
    if (this.categoryToDelete === null) return;
    this.settingsService.deleteCategory(this.categoryToDelete).subscribe({
      next: () => {
        this.isDeleteCategoryModalOpen = false;
        this.loadData();
        this.showSuccess('Category deleted successfully');
      },
      error: (err) => {
        this.showError('Fail to delete category');
      }
    });
  }
}