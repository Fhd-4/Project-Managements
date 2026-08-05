import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Milestone {
  id?: number;
  name: string;
  targetDate: string;
}

export interface Deliverable {
  id?: number;
  name: string;
  expectedCompletionDate: string;
}

export interface Plan {
  id?: number;
  name: string;
  description: string;
  projectId: number;
  projectName?: string;
  version?: string;
  createdBy?: string;
  startDate: string;
  endDate: string;
  lastUpdated?: string;
  milestones: Milestone[];
  deliverables: Deliverable[];
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private apiUrl = `${environment.apiUrl}/Plans`;

  public successToast$ = new BehaviorSubject<boolean>(false);
  public errorToast$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  getAllPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.apiUrl}/all`);
  }

  getPlanDetails(id: number): Observable<Plan> {
    return this.http.get<Plan>(`${this.apiUrl}/details/${id}`);
  }

  createPlan(plan: Plan): Observable<Plan> {
    return this.http.post<Plan>(`${this.apiUrl}/create`, plan);
  }

  updatePlan(id: number, plan: Plan): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/update/${id}`, plan);
  }

  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}