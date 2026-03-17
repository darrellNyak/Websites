import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Celebrity } from '../../models/celebrity';
import { CelebrityService } from '../../services/celebrity.service';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-celebrity-search',
  templateUrl: './celebrity-search.html',
  styleUrls: ['./celebrity-search.css'],
  imports: [CommonModule, FormsModule]
})
export class CelebritySearch implements OnDestroy {
  @Output() celebritySelected = new EventEmitter<Celebrity>();
  
  searchQuery = '';
  searchResults: Celebrity[] = [];
  showResults = false;
  loading = false;
  private readonly search$ = new Subject<string>();
  private sub?: Subscription;

  constructor(private celebrityService: CelebrityService) {}

  onSearch(): void {
    if (!this.sub) {
      this.sub = this.search$
        .pipe(
          debounceTime(250),
          distinctUntilChanged(),
          tap((q) => {
            if (q.length <= 1) {
              this.loading = false;
              this.searchResults = [];
              this.showResults = false;
            } else {
              this.loading = true;
              this.showResults = true;
            }
          }),
          switchMap((q) => {
            if (q.length <= 1) return of([] as Celebrity[]);
            return this.celebrityService.searchCelebrities(q).pipe(
              catchError((error) => {
                console.error('Search error:', error);
                return of([] as Celebrity[]);
              })
            );
          })
        )
        .subscribe((results) => {
          this.searchResults = results;
          this.loading = false;
          this.showResults = this.searchQuery.length > 1;
        });
    }

    this.search$.next(this.searchQuery.trim());
  }

  selectCelebrity(celebrity: Celebrity): void {
    this.celebritySelected.emit(celebrity);
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}