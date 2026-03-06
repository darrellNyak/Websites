import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Celebrity } from '../models/celebrity';

@Injectable({
  providedIn: 'root'
})
export class WikipediaService {
  private readonly API_BASE_URL = 'http://localhost:3000/api/wikipedia';

  constructor(private http: HttpClient) {}

  searchCelebrities(query: string): Observable<Celebrity[]> {
    const url = `${this.API_BASE_URL}/search?query=${encodeURIComponent(query)}`;
    
    return this.http.get<Celebrity[]>(url).pipe(
      catchError(error => {
        console.error('Wikipedia search error:', error);
        return of([]);
      })
    );
  }

  getCelebrityDetails(title: string): Observable<Celebrity> {
    // Remove 'wiki_' prefix if present and decode
    const cleanTitle = title.replace('wiki_', '').replace(/_/g, ' ');
    const url = `${this.API_BASE_URL}/person/${encodeURIComponent(cleanTitle)}`;
    
    return this.http.get<Celebrity>(url).pipe(
      catchError(error => {
        console.error(`Wikipedia details error for ${title}:`, error);
        return of({
          id: `wiki_${title.replace(/\s/g, '_')}`,
          name: title,
          profession: ['Celebrity'],
          imageUrl: '/assets/images/placeholder.jpg',
          source: 'wikipedia' as const
        });
      })
    );
  }

  /**
   * Find connection between two celebrities using Wikipedia links
   * This is a basic implementation - Wikipedia API doesn't provide direct connection finding
   * Returns an array of celebrity names forming the connection path
   */
  findConnection(startName: string, endName: string): Observable<string[]> {
    console.log(`Wikipedia connection search from ${startName} to ${endName}`);
    
    // Clean names (remove disambiguation)
    const cleanStartName = startName.replace(/\s*\(.*?\)\s*/g, '').trim();
    const cleanEndName = endName.replace(/\s*\(.*?\)\s*/g, '').trim();
    
    const url = `${this.API_BASE_URL}/connection?startName=${encodeURIComponent(cleanStartName)}&endName=${encodeURIComponent(cleanEndName)}`;
    
    return this.http.get<string[]>(url).pipe(
      catchError(error => {
        console.error('Wikipedia connection search error:', error);
        return of([]);
      })
    );
  }

}