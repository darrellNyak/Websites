import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { Celebrity } from '../models/celebrity';

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private readonly API_BASE_URL = '/api/tmdb';
  private readonly IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  constructor(private http: HttpClient) {}

  searchCelebrities(query: string, page: number = 1): Observable<{ celebrities: Celebrity[], total: number }> {
    const url = `${this.API_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}`;
    
    return this.http.get<{ celebrities: Celebrity[], total: number, page: number }>(url).pipe(
      catchError(error => {
        console.error('TMDB search error:', error);
        return of({ celebrities: [], total: 0 });
      })
    );
  }

  getPopularCelebrities(): Observable<Celebrity[]> {
    const url = `${this.API_BASE_URL}/popular`;
    
    return this.http.get<Celebrity[]>(url).pipe(
      catchError(error => {
        console.error('TMDB popular celebrities error:', error);
        return of([]);
      })
    );
  }

  getCelebrityDetails(id: string): Observable<Celebrity> {
    // Remove 'tmdb_' prefix if present
    const tmdbId = id.replace('tmdb_', '');
    const url = `${this.API_BASE_URL}/person/${tmdbId}`;
    
    return this.http.get<Celebrity>(url).pipe(
      catchError(error => {
        console.error(`TMDB celebrity details error for ID ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get combined credits (both movies and TV shows) for a celebrity
   */
  getCelebrityCredits(id: string): Observable<{ cast: any[], crew: any[] }> {
    // Remove 'tmdb_' prefix if present
    const tmdbId = id.replace('tmdb_', '');
    const url = `${this.API_BASE_URL}/person/${tmdbId}/credits`;
    
    return this.http.get<{ cast: any[], crew: any[] }>(url).pipe(
      catchError(error => {
        console.error(`TMDB celebrity credits error for ID ${id}:`, error);
        return of({ cast: [], crew: [] });
      })
    );
  }

  /**
   * NEW: Get ONLY TV credits for a celebrity
   */
  getCelebrityTVCredits(id: string): Observable<{ cast: any[], crew: any[] }> {
    // Remove 'tmdb_' prefix if present
    const tmdbId = id.replace('tmdb_', '');
    const url = `${this.API_BASE_URL}/person/${tmdbId}/tv-credits`;
    
    return this.http.get<{ cast: any[], crew: any[] }>(url).pipe(
      catchError(error => {
        console.error(`TMDB TV credits error for ID ${id}:`, error);
        return of({ cast: [], crew: [] });
      })
    );
  }

  /**
   * Get credits for a specific movie
   */
  getMovieCredits(movieId: number): Observable<{ cast: any[], crew: any[] }> {
    const url = `${this.API_BASE_URL}/movie/${movieId}/credits`;
    
    return this.http.get<{ cast: any[], crew: any[] }>(url).pipe(
      catchError(error => {
        console.error(`TMDB movie credits error for movie ${movieId}:`, error);
        throw error;
      })
    );
  }

  /**
   * NEW: Get credits for a specific TV show
   */
  getTVShowCredits(tvId: number): Observable<{ cast: any[], crew: any[] }> {
    const url = `${this.API_BASE_URL}/tv/${tvId}/credits`;
    
    return this.http.get<{ cast: any[], crew: any[] }>(url).pipe(
      catchError(error => {
        if (error.status !== 404) {
          console.error(`TMDB TV credits error for show ${tvId}:`, error);
        }
        throw error;
      })
    );
  }

  /**
   * Get details for a specific movie
   */
  getMovieDetails(movieId: number): Observable<any> {
    const url = `${this.API_BASE_URL}/movie/${movieId}`;
    
    return this.http.get<any>(url).pipe(
      catchError(error => {
        console.error(`TMDB movie details error for movie ${movieId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Get details for a specific TV show
   */
  getTVShowDetails(tvShowId: number): Observable<any> {
    const url = `${this.API_BASE_URL}/tv/${tvShowId}`;
    
    return this.http.get<any>(url).pipe(
      catchError(error => {
        console.error(`TMDB TV show details error for show ${tvShowId}:`, error);
        return of(null);
      })
    );
  }
}