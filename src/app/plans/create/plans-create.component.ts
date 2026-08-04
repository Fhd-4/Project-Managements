import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService, Plan, Milestone, Deliverable } from '../plan.service';

@Component({
  selector: 'app-plans-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plans-create.component.html',
  styleUrl: './plans-create.component.scss'
})
export class PlansCreateComponent implements OnInit {
  isRtl: boolean = false;
  
  // Form Model
  planName: string = '';
  projectId: number = 1;
  description: string = '';
  startDate: string = '2026-05-16';
  endDate: string = '2027-05-16';

  milestones: Milestone[] = [
    { name: '', targetDate: '2026-05-16' },
    { name: '', targetDate: '2026-05-16' }
  ];

  deliverables: Deliverable[] = [
    { name: '', expectedCompletionDate: '2026-05-16' },
    { name: '', expectedCompletionDate: '2026-05-16' }
  ];

  projects = [
    { id: 1, name: 'ERP Platform' },
    { id: 2, name: 'Digital Transformation' }
  ];

  constructor(private planService: PlanService, private router: Router) {}

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.isRtl = localStorage.getItem('preferred_lang') === 'ar';
    }
  }

  addMilestone() {
    this.milestones.push({ name: '', targetDate: '2026-05-16' });
  }

  removeMilestone(index: number) {
    if (this.milestones.length > 1) this.milestones.splice(index, 1);
  }

  addDeliverable() {
    this.deliverables.push({ name: '', expectedCompletionDate: '2026-05-16' });
  }

  removeDeliverable(index: number) {
    if (this.deliverables.length > 1) this.deliverables.splice(index, 1);
  }

  goBack() {
    this.router.navigate(['/plans']);
  }

  savePlan() {
    if (!this.planName) return;

    const payload: Plan = {
      name: this.planName,
      description: this.description,
      projectId: this.projectId,
      projectName: this.projects.find(p => p.id == this.projectId)?.name || 'ERP Platform',
      startDate: this.startDate,
      endDate: this.endDate,
      createdBy: 'Abdallah Othman',
      milestones: this.milestones.filter(m => m.name.trim() !== ''),
      deliverables: this.deliverables.filter(d => d.name.trim() !== '')
    };

    this.planService.createPlan(payload).subscribe({
      next: () => this.router.navigate(['/plans']),
      error: (err) => console.error(err)
    });
  }
}