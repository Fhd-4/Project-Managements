import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, Category, Role } from './settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule], // These are critical for the HTML to work
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  activeTab: 'roles' | 'categories' = 'roles';
  searchQuery = '';
  
  // Data initialized to empty arrays to prevent HTML crashes
  roles: Role[] = [];
  categories: Category[] = [];
  
  // Modal States
  isAddRoleModalOpen = false;
  isAddCategoryModalOpen = false;
  isDeleteCategoryModalOpen = false;
  
  // Form Models
  newRoleName = '';
  newCategoryName = '';
  newCategoryAssignTo = '';
  categoryToDelete: number | null = null;

  assignToOptions = ['Program', 'Portfolio', 'Project', 'Task'];

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  switchTab(tab: 'roles' | 'categories') {
    this.activeTab = tab;
    this.searchQuery = '';
    this.loadData();
  }

  loadData() {
    if (this.activeTab === 'roles') {
      this.settingsService.getRoles().subscribe({
        next: (res) => {
          this.roles = res || [];
        },
        error: (err) => {
          console.error('Failed to load roles', err);
          this.roles = [];
        }
      });
    } else {
      this.settingsService.getCategories(this.searchQuery).subscribe({
        next: (res) => {
          this.categories = res || [];
        },
        error: (err) => {
          console.error('Failed to load categories', err);
          this.categories = [];
        }
      });
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
    this.settingsService.createRole(this.newRoleName).subscribe(() => {
      this.isAddRoleModalOpen = false;
      this.loadData();
    });
  }

  // --- Category Actions ---
  saveCategory() {
    if (!this.newCategoryName.trim() || !this.newCategoryAssignTo) return;
    
    const newCat: Category = { name: this.newCategoryName, assignTo: this.newCategoryAssignTo };
    this.settingsService.createCategory(newCat).subscribe(() => {
      this.isAddCategoryModalOpen = false;
      this.loadData();
    });
  }

  confirmDeleteCategory(id: number) {
    this.categoryToDelete = id;
    this.isDeleteCategoryModalOpen = true;
  }

  deleteCategory() {
    if (this.categoryToDelete === null) return;
    this.settingsService.deleteCategory(this.categoryToDelete).subscribe(() => {
      this.isDeleteCategoryModalOpen = false;
      this.loadData();
    });
  }
}