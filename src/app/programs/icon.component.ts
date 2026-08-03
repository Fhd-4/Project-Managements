import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'box' | 'clock' | 'trending-up' | 'check-circle'
  | 'eye' | 'edit' | 'trash' | 'search' | 'plus'
  | 'chevron-left' | 'chevron-down' | 'upload-cloud'
  | 'file' | 'list' | 'grid' | 'user' | 'x' | 'download';

// Single-color, stroke-based icon set (no Office-style colorful glyphs).
// Sizing/color controlled entirely via CSS (stroke: currentColor).
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" [attr.stroke-width]="strokeWidth"
         stroke-linecap="round" stroke-linejoin="round" class="app-icon">
      <ng-container [ngSwitch]="name">
        <ng-container *ngSwitchCase="'box'">
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v10l9 4 9-4V7" />
          <path d="M12 11v10" />
        </ng-container>
        <ng-container *ngSwitchCase="'clock'">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </ng-container>
        <ng-container *ngSwitchCase="'trending-up'">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M15 7h6v6" />
        </ng-container>
        <ng-container *ngSwitchCase="'check-circle'">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l3 3 5-6" />
        </ng-container>
        <ng-container *ngSwitchCase="'eye'">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </ng-container>
        <ng-container *ngSwitchCase="'edit'">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </ng-container>
        <ng-container *ngSwitchCase="'trash'">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </ng-container>
        <ng-container *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </ng-container>
        <ng-container *ngSwitchCase="'plus'">
          <path d="M12 5v14M5 12h14" />
        </ng-container>
        <ng-container *ngSwitchCase="'chevron-left'">
          <path d="M15 18l-6-6 6-6" />
        </ng-container>
        <ng-container *ngSwitchCase="'chevron-down'">
          <path d="M6 9l6 6 6-6" />
        </ng-container>
        <ng-container *ngSwitchCase="'upload-cloud'">
          <path d="M12 15V4M8 8l4-4 4 4" />
          <path d="M5 17a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.7-1.6A4.5 4.5 0 0 1 19 17H5z" />
        </ng-container>
        <ng-container *ngSwitchCase="'file'">
          <path d="M6 2h9l5 5v15H6V2z" />
          <path d="M14 2v5h5" />
        </ng-container>
        <ng-container *ngSwitchCase="'list'">
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" />
        </ng-container>
        <ng-container *ngSwitchCase="'grid'">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </ng-container>
        <ng-container *ngSwitchCase="'user'">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
        </ng-container>
        <ng-container *ngSwitchCase="'x'">
          <path d="M18 6L6 18M6 6l12 12" />
        </ng-container>
        <ng-container *ngSwitchCase="'download'">
          <path d="M12 3v12M7 10l5 5 5-5" />
          <path d="M5 21h14" />
        </ng-container>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; line-height: 0; }
    .app-icon { display: block; }
  `]
})
export class IconComponent {
  @Input() name: IconName = 'box';
  @Input() size: number = 18;
  @Input() strokeWidth: number = 1.6;
}