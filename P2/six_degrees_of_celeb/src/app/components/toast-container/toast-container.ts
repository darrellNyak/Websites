import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrls: ['./toast-container.css'],
})
export class ToastContainer {
  constructor(public toastService: ToastService) {}

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}

