import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PlanService, Plan } from '../plan.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-plan-details',
  standalone: true,
  imports: [CommonModule],
  // 👇 Exactly matching your physical file names!
  templateUrl: './plans_details.html',
  styleUrl: './plans_details.scss'
})
export class PlanDetailsComponent implements OnInit {
  currentLang: LangCode = 'ar';
  planId: number | null = null;
  plan: Plan | null = null;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private planService: PlanService,
    private cdr: ChangeDetectorRef
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) this.currentLang = savedLang;
    }
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  ngOnInit() {
    // 1. Grab the ID from the URL (e.g., /plans/details/5)
    this.planId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (this.planId) {
      this.loadPlanDetails(this.planId);
    } else {
      this.goBack(); // If no ID is found, kick them back to the list
    }
  }

  loadPlanDetails(id: number) {
    this.isLoading = true;
    
    // Fetch all plans and find the one that matches our ID
    // (Note: If your API has a specific 'getPlanById(id)' method, use that here instead!)
    this.planService.getAllPlans().subscribe({
      next: (plans) => {
        this.plan = plans.find(p => p.id === id) || null;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    // Acts exactly like the browser's back button
    this.location.back();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(this.isRtl ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: '2-digit'
    });
  }
}