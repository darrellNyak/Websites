import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Celebrity } from '../../models/celebrity';
import { CelebrityService } from '../../services/celebrity.service';

@Component({
  selector: 'app-celebrity-search',
  templateUrl: './celebrity-search.html',
  styleUrls: ['./celebrity-search.css'],
  imports: [CommonModule, FormsModule]
})
export class CelebritySearch {
  @Output() celebritySelected = new EventEmitter<Celebrity>();
  
  searchQuery = '';
  searchResults: Celebrity[] = [];
  showResults = false;

  constructor(private celebrityService: CelebrityService) {}

  onSearch(): void {
    if (this.searchQuery.length > 1) {
      this.celebrityService.searchCelebrities(this.searchQuery).subscribe({
        next: (results) => {
          this.searchResults = results;
          this.showResults = true;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.searchResults = [];
          this.showResults = false;
        }
      });
    } else {
      this.searchResults = [];
      this.showResults = false;
    }
  }

  selectCelebrity(celebrity: Celebrity): void {
    this.celebritySelected.emit(celebrity);
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;
  }
}