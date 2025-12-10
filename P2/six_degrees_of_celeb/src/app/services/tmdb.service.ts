import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
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

  getCelebrityCredits(id: string): Observable<{ cast: any[], crew: any[] }> {
    const url = `${this.BASE_URL}/person/${id}/combined_credits?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        cast: response.cast || [],
        crew: response.crew || []
      })),
      catchError(error => {
        console.error(`TMDB celebrity credits error for ID ${id}:`, error);
        return of({ cast: [], crew: [] });
      })
    );
  }

  getMovieCredits(movieId: number): Observable<{ cast: any[], crew: any[] }> {
    const url = `${this.BASE_URL}/movie/${movieId}/credits?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        cast: response.cast || [],
        crew: response.crew || []
      })),
      catchError(error => {
        console.error(`TMDB movie credits error for movie ${movieId}:`, error);
        return of({ cast: [], crew: [] });
      })
    );
  }

  getTVCredits(tvId: number): Observable<{ cast: any[], crew: any[] }> {
    const url = `${this.BASE_URL}/tv/${tvId}/credits?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        cast: response.cast || [],
        crew: response.crew || []
      })),
      catchError(error => {
        console.error(`TMDB TV credits error for show ${tvId}:`, error);
        return of({ cast: [], crew: [] });
      })
    );
  }

  getMovieDetails(movieId: number): Observable<any> {
    const url = `${this.BASE_URL}/movie/${movieId}?api_key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      catchError(error => {
        console.error(`TMDB movie details error for movie ${movieId}:`, error);
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