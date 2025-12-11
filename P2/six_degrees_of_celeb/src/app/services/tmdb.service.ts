import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { Celebrity } from '../models/celebrity';

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private readonly API_KEY = '4753b9b7963ea7a28318fa95acc8f1e2';
  private readonly BASE_URL = 'https://api.themoviedb.org/3';
  private readonly IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  constructor(private http: HttpClient) {}

  searchCelebrities(query: string, page: number = 1): Observable<{ celebrities: Celebrity[], total: number }> {
    const url = `${this.BASE_URL}/search/person?api_key=${this.API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        celebrities: response.results.map((person: any) => this.mapTmdbToCelebrity(person)),
        total: response.total_results
      })),
      catchError(error => {
        console.error('TMDB search error:', error);
        return of({ celebrities: [], total: 0 });
      })
    );
  }

  getPopularCelebrities(): Observable<Celebrity[]> {
    const url = `${this.BASE_URL}/person/popular?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => response.results.map((person: any) => this.mapTmdbToCelebrity(person))),
      catchError(error => {
        console.error('TMDB popular celebrities error:', error);
        return of([]);
      })
    );
  }

  getCelebrityDetails(id: string): Observable<Celebrity> {
    const url = `${this.BASE_URL}/person/${id}?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(person => this.mapTmdbToCelebrity(person, true)),
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
    const url = `${this.BASE_URL}/person/${id}/combined_credits?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        cast: (response.cast || [])
          .filter((c: any) => c.media_type === 'movie') // Only movies
          .map((c: any) => ({
            ...c,
            mediaType: 'movie'
          })),
        crew: (response.crew || []).map((c: any) => ({
          ...c,
          mediaType: c.media_type
        }))
      })),
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
    const url = `${this.BASE_URL}/person/${id}/combined_credits?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        cast: (response.cast || [])
          .filter((c: any) => c.media_type === 'tv') // Only TV shows
          .map((c: any) => ({
            ...c,
            mediaType: 'tv'
          })),
        crew: (response.crew || [])
          .filter((c: any) => c.media_type === 'tv')
          .map((c: any) => ({
            ...c,
            mediaType: 'tv'
          }))
      })),
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
    const url = `${this.BASE_URL}/movie/${movieId}/credits?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        cast: response.cast || [],
        crew: response.crew || []
      })),
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
    const url = `${this.BASE_URL}/tv/${tvId}/credits?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        cast: (response.cast || []).map((c: any) => ({ ...c, mediaType: 'tv' })),
        crew: response.crew || []
      })),
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
    const url = `${this.BASE_URL}/movie/${movieId}?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      catchError(error => {
        console.error(`TMDB movie details error for movie ${movieId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * NEW: Get details for a specific TV show
   */
  getTVShowDetails(tvShowId: number): Observable<any> {
    const url = `${this.BASE_URL}/tv/${tvShowId}?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      catchError(error => {
        console.error(`TMDB TV show details error for show ${tvShowId}:`, error);
        return of(null);
      })
    );
  }

  private mapTmdbToCelebrity(person: any, includeDetails: boolean = false): Celebrity {
    const professions = this.getProfessionsFromKnownFor(person.known_for || person.known_for_department);
    
    return {
      id: `tmdb_${person.id}`,
      name: person.name,
      profession: professions.length > 0 ? professions : [person.known_for_department || 'Actor'],
      imageUrl: person.profile_path ? `${this.IMAGE_BASE_URL}${person.profile_path}` : '/assets/images/placeholder.jpg',
      description: includeDetails ? person.biography : undefined,
      popularity: person.popularity,
      source: 'tmdb'
    };
  }

  private getProfessionsFromKnownFor(knownFor: any): string[] {
    const professions = new Set<string>();
    
    if (Array.isArray(knownFor)) {
      knownFor.forEach((item: any) => {
        if (item.media_type === 'movie') {
          professions.add('Actor');
        } else if (item.media_type === 'tv') {
          professions.add('TV Actor');
        }
      });
    } else if (typeof knownFor === 'string') {
      professions.add(knownFor);
    }
    
    return Array.from(professions);
  }
}