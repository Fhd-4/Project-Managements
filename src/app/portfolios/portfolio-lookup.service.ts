import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';
import { PortfolioService } from '../portfolios/portfolio.service';

// Programs have no owner of their own — "Program Owner" is the owning
// Portfolio's ownerName. This wraps PortfolioService with an in-memory
// cache keyed by portfolioId so viewing multiple programs under the same
// portfolio doesn't re-fetch it every time.
@Injectable({
  providedIn: 'root'
})
export class PortfolioLookupService {
  private cache = new Map<number, Observable<{ ownerName?: string; nameAr?: string; nameEn?: string }>>();

  constructor(private portfolioService: PortfolioService) {}

  getPortfolio(portfolioId: number) {
    if (!this.cache.has(portfolioId)) {
      const req$ = this.portfolioService.getPortfolioDetails(portfolioId).pipe(
        map(p => ({ ownerName: p.ownerName, nameAr: p.nameAr, nameEn: p.nameEn })),
        catchError(() => of({ ownerName: undefined, nameAr: undefined, nameEn: undefined })),
        shareReplay(1)
      );
      this.cache.set(portfolioId, req$);
    }
    return this.cache.get(portfolioId)!;
  }
}