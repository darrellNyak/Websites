import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.html',
  styleUrls: ['./loading-spinner.css'],
  imports: [CommonModule]
})
export class LoadingSpinner {
  @Input() loading: boolean = false;
  @Input() message: string = '';
}