import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Celebrity } from '../../models/celebrity';

@Component({
  selector: 'app-celebrity-card',
  templateUrl: './celebrity-card.html',
  styleUrls: ['./celebrity-card.css'],
  imports: [CommonModule]
})
export class CelebrityCard {
  @Input() celebrity!: Celebrity;
}