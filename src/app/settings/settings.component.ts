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
  activeTab: 'roles' | 'categories' = 'roles';
  searchQuery = '';
  
  roles: Role[] = [];
  categories: Category[] = [];
  
  isAddRoleModalOpen = false;
  isAddCategoryModalOpen = false;
  isDeleteCategoryModalOpen = false;
  
  newRoleName = '';
  newCategoryName = '';
  newCategoryAssignTo = '';
  categoryToDelete: number | null = null;

  assignToOptions = ['Program', 'Portfolio', 'Project', 'Task'];

  // Toast States
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

  // --- Toast Helpers ---
  showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = ''; // Clear any existing errors
    this.cdr.detectChanges();
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  }

  showError(message: string) {
    this.errorMessage = message;
    this.successMessage = ''; // Clear any existing successes
    this.cdr.detectChanges();
    setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
  }

  switchTab(tab: 'roles' | 'categories') {
    this.activeTab = tab;
    this.searchQuery = '';
    this.loadData();
  }

  loadData() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.activeTab === 'roles') {
        this.settingsService.getRoles().subscribe({
          next: (res) => {
            this.roles = res || [];
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Failed to load roles:', err);
            this.roles = [];
            this.cdr.detectChanges(); 
          }
        });
      } else {
        this.settingsService.getCategories(this.searchQuery).subscribe({
          next: (res) => {
            this.categories = res || [];
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Failed to load categories:', err);
            this.categories = [];
            this.cdr.detectChanges();
          }
        });
      }
    }
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

  // --- Role Actions ---
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

  // --- Category Actions ---
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