import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Celebrity, ConnectionPath } from './models/celebrity';
import { CelebrityService } from './services/celebrity.service';
import { CelebritySearch } from './components/celebrity-search/celebrity-search';
import { ConnectionPath as ConnectionPathComponent } from './components/connection-path/connection-path';
import { CelebrityCard } from './components/celebrity-card/celebrity-card';
import { LoadingSpinner } from './components/loading-spinner/loading-spinner';
import { ToastContainer } from './components/toast-container/toast-container';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [
    CommonModule,
    CelebritySearch,
    ConnectionPathComponent,
    CelebrityCard,
    LoadingSpinner,
    ToastContainer,
  ],
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

  constructor(
    private celebrityService: CelebrityService,
    private toastService: ToastService
  ) { }

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

  private showPopup(message: string): void {
    this.toastService.show(message, { type: 'warning', title: 'Heads up' });
  }

  onStartCelebritySelected(celebrity: Celebrity): void {
    if (this.endCelebrity && this.endCelebrity.id === celebrity.id) {
      this.showPopup("Please choose two different celebrities — you can't pick the same person twice.");
      return;
    }
    this.startCelebrity = celebrity;
    this.findConnection();
  }

  onEndCelebritySelected(celebrity: Celebrity): void {
    if (this.startCelebrity && this.startCelebrity.id === celebrity.id) {
      this.showPopup("Please choose two different celebrities — you can't pick the same person twice.");
      return;
    }
    this.endCelebrity = celebrity;
    this.findConnection();
  }

  findConnection(): void {
    if (this.startCelebrity && this.endCelebrity) {
      if (this.startCelebrity.id === this.endCelebrity.id) {
        this.showPopup("Please choose two different celebrities — you can't pick the same person twice.");
        return;
      }

      console.log(
        `Finding connection between ${this.startCelebrity.name} and ${this.endCelebrity.name}`
      );

      this.loading = true;
      this.error = null;
      this.connectionPath = null;
      this.celebrityService.clearConnectionGraph();

      this.celebrityService
        .findConnection(this.startCelebrity.id, this.endCelebrity.id)
        .subscribe({
          next: (path) => {
            console.log('Connection path found:', path);
            this.connectionPath = path;
            this.loading = false;
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

  resetSearch(): void {
    this.startCelebrity = null;
    this.endCelebrity = null;
    this.connectionPath = null;
    this.error = null;
    this.celebrityService.clearConnectionGraph();
  }
}
