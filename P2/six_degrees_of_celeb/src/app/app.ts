import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Celebrity, ConnectionPath } from './models/celebrity';
import { CelebrityService } from './services/celebrity.service';
import { CelebritySearch } from './components/celebrity-search/celebrity-search';
import { ConnectionPath as ConnectionPathComponent } from './components/connection-path/connection-path';
import { CelebrityCard } from './components/celebrity-card/celebrity-card';
import { LoadingSpinner } from './components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [CommonModule, CelebritySearch, ConnectionPathComponent, CelebrityCard, LoadingSpinner],
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  title = 'Six Degrees of Celebrity';
  startCelebrity: Celebrity | null = null;
  endCelebrity: Celebrity | null = null;
  connectionPath: ConnectionPath | null = null;
  popularCelebrities: Celebrity[] = [];
  isDarkMode = false;

  loading = false;
  error: string | null = null;
  //New
  currentSearchDepth = 3; // Start with 3 degrees
  maxSearchDepth = 6; // Maximum depth allowed
  canExpandSearch = false; // Show expand button when no connection found

  constructor(private celebrityService: CelebrityService) {}

  ngOnInit(): void {
    this.loadPopularCelebrities();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  onStartCelebritySelected(celebrity: Celebrity): void {
    this.startCelebrity = celebrity;
    this.findConnection();
  }

  onEndCelebritySelected(celebrity: Celebrity): void {
    this.endCelebrity = celebrity;
    this.findConnection();
  }
  /*NEW */
  findConnection(depth?: number): void {
    if (this.startCelebrity && this.endCelebrity) {
      const searchDepth = depth || this.currentSearchDepth;
      console.log(
        `Finding connection between ${this.startCelebrity.name} and ${this.endCelebrity.name} at depth ${searchDepth}`
      );

      this.loading = true;
      this.error = null;
      this.connectionPath = null;
      this.canExpandSearch = false;

      this.celebrityService
        .findConnectionWithDepth(this.startCelebrity.id, this.endCelebrity.id, searchDepth)
        .subscribe({
          next: (path) => {
            console.log('Connection path found:', path);
            this.connectionPath = path;
            this.loading = false;

            // If no path found and we haven't reached max depth, allow expansion
            if (!path && searchDepth < this.maxSearchDepth) {
              this.canExpandSearch = true;
              this.currentSearchDepth = searchDepth;
            }
          },
          error: (error) => {
            console.log('Error finding connection:', error);
            this.error = 'Failed to find connection. Please try again.';
            this.loading = false;
            console.error('Connection search error:', error);
          },
        });
    }
  }

  //*NEW */ ADD this new method (after findConnection)
  expandSearch(): void {
    if (this.currentSearchDepth < this.maxSearchDepth) {
      this.currentSearchDepth++;
      console.log(`Expanding search to depth ${this.currentSearchDepth}`);

      // Clear the connection graph to rebuild with deeper search
      this.celebrityService.clearConnectionGraph();

      this.findConnection(this.currentSearchDepth);
    }
  }

  loadPopularCelebrities(): void {
    this.celebrityService.getPopularCelebrities().subscribe({
      next: (celebrities) => {
        this.popularCelebrities = celebrities;
      },
      error: (error) => {
        console.error('Failed to load popular celebrities:', error);
      },
    });
  }

  swapCelebrities(): void {
    [this.startCelebrity, this.endCelebrity] = [this.endCelebrity, this.startCelebrity];
    this.findConnection();
  }

  /*NEW */
  resetSearch(): void {
    this.startCelebrity = null;
    this.endCelebrity = null;
    this.connectionPath = null;
    this.error = null;
    this.currentSearchDepth = 3; // Reset to initial depth
    this.canExpandSearch = false;
    this.celebrityService.clearConnectionGraph();
  }
}
