import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  imports: [CommonModule],
  template: `
    <div class="spinner-container" *ngIf="loading">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>
  `,
  styleUrls: ['./loading-spinner.css']
})
export class LoadingSpinner {
  @Input() loading = false;
  @Input() message = 'Loading...';
}