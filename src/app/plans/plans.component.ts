import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService, Plan } from './plan.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plans.component.html',
  styleUrl: './plans.component.scss'
})
export class PlansComponent implements OnInit {
  currentLang: LangCode = 'ar';
  searchQuery: string = '';
  plans: Plan[] = [];
  isLoading: boolean = true;

  constructor(
    private planService: PlanService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) this.currentLang = savedLang;
    }
  }

  ngOnInit() {
    this.loadPlans();
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadPlans() {
    this.isLoading = true;
    this.planService.getAllPlans().subscribe({
      next: (data) => {
        this.plans = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredPlans(): Plan[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.plans;
    return this.plans.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.projectName && p.projectName.toLowerCase().includes(query)) ||
      (p.createdBy && p.createdBy.toLowerCase().includes(query))
    );
  }

  openCreatePage() {
    this.router.navigate(['/plans/create']);
  }

  viewPlanDetails(id: string | number) {
    // Navigates to the Read-Only Details page
    this.router.navigate(['/plans/details', id]);
  }

  editPlan(id: string | number) {
    // Navigates to the Create form, passing the ID in the URL for editing
    this.router.navigate(['/plans/edit', id]);
  }

  deletePlan(id: number) {
    if (confirm(this.isRtl ? 'هل أنت متأكد من حذف هذه الخطة؟' : 'Are you sure you want to delete this plan?')) {
      this.planService.deletePlan(id).subscribe(() => this.loadPlans());
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(this.isRtl ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: '2-digit'
    });
  }
}