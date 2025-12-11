import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { Celebrity } from '../models/celebrity';

@Injectable({
  providedIn: 'root'
})
export class WikipediaService {
  private readonly BASE_URL = 'https://en.wikipedia.org/api/rest_v1';
  private readonly SEARCH_URL = 'https://en.wikipedia.org/w/api.php';

  constructor(private http: HttpClient) {}

  searchCelebrities(query: string): Observable<Celebrity[]> {
    const searchUrl = `${this.SEARCH_URL}?action=opensearch&search=${encodeURIComponent(query)}&limit=10&namespace=0&format=json&origin=*`;
    
    return this.http.get<any>(searchUrl).pipe(
      map(response => {
        const titles = response[1] || [];
        const descriptions = response[2] || [];
        
        const celebrityResults = titles
          .map((title: string, index: number) => ({
            title,
            description: descriptions[index] || ''
          }))
          .filter((item: any) => this.isCelebrityDescription(item.description || item.title));

        return celebrityResults.slice(0, 5);
      }),
      map(results => {
        return results.map((result: any) => ({
          id: `wiki_${result.title.replace(/\s/g, '_')}`,
          name: result.title,
          profession: this.extractProfession(result.description),
          imageUrl: '/assets/images/placeholder.jpg',
          description: result.description,
          source: 'wikipedia' as const
        }));
      }),
      catchError(error => {
        console.error('Wikipedia search error:', error);
        return of([]);
      })
    );
  }

  getCelebrityDetails(title: string): Observable<Celebrity> {
    const url = `${this.BASE_URL}/page/summary/${encodeURIComponent(title)}`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.type === 'standard') {
          return this.mapWikipediaToCelebrity(response);
        }
        throw new Error('Page not found');
      }),
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
    
    // Get links from both celebrities' pages
    return forkJoin([
      this.getPageLinks(startName),
      this.getPageLinks(endName)
    ]).pipe(
      map(([startLinks, endLinks]) => {
        // Check for direct connection (1 degree)
        if (startLinks.includes(endName)) {
          console.log('Found direct connection (1 degree)');
          return [startName, endName];
        }
        
        if (endLinks.includes(startName)) {
          console.log('Found direct connection (1 degree)');
          return [startName, endName];
        }
        
        // Check for 2-degree connection (mutual link)
        const mutualLinks = startLinks.filter(link => endLinks.includes(link));
        if (mutualLinks.length > 0) {
          // Find the first mutual link that looks like a person
          const personLink = mutualLinks.find(link => this.isLikelyPersonName(link));
          if (personLink) {
            console.log('Found 2-degree connection via', personLink);
            return [startName, personLink, endName];
          }
        }
        
        // No connection found within 2 degrees
        // Wikipedia API is limited for deeper searches without heavy computation
        console.log('No Wikipedia connection found within 2 degrees');
        return [];
      }),
      catchError(error => {
        console.error('Wikipedia connection search error:', error);
        return of([]);
      })
    );
  }

  /**
   * Get links from a Wikipedia page
   */
  private getPageLinks(pageName: string): Observable<string[]> {
    const url = `${this.SEARCH_URL}?action=query&titles=${encodeURIComponent(pageName)}&prop=links&pllimit=100&format=json&origin=*`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        const pages = response.query?.pages || {};
        const pageId = Object.keys(pages)[0];
        
        if (pageId === '-1') {
          return [];
        }
        
        const links = pages[pageId]?.links || [];
        return links
          .map((link: any) => link.title)
          .filter((title: string) => this.isLikelyPersonName(title));
      }),
      catchError(error => {
        console.error(`Error getting links for ${pageName}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Check if a Wikipedia page title is likely a person's name
   */
  private isLikelyPersonName(title: string): boolean {
    // Filter out common Wikipedia namespace pages
    const excludePatterns = [
      'List of', 'Category:', 'File:', 'Template:', 'Help:', 'Wikipedia:',
      'Portal:', 'Draft:', 'TimedText:', 'Module:', 'MediaWiki:',
      'Special:', 'Talk:', 'User:', 'Book:'
    ];
    
    if (excludePatterns.some(pattern => title.startsWith(pattern))) {
      return false;
    }
    
    // Check if title has parentheses (often indicates disambiguation or type)
    // e.g., "John Smith (actor)" - we want to keep these
    const hasParentheses = /\([^)]+\)/.test(title);
    if (hasParentheses) {
      const parenthesesContent = title.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '';
      const personKeywords = [
        'actor', 'actress', 'singer', 'musician', 'director', 'producer',
        'writer', 'comedian', 'model', 'artist', 'performer', 'celebrity',
        'born', 'died'
      ];
      
      if (personKeywords.some(keyword => parenthesesContent.includes(keyword))) {
        return true;
      }
    }
    
    // Simple heuristic: likely a person if it has 2-4 words and starts with capital
    const words = title.split(' ').filter(w => w.length > 0);
    const isCapitalized = /^[A-Z]/.test(title);
    
    return isCapitalized && words.length >= 2 && words.length <= 4;
  }

  private isCelebrityDescription(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    const celebrityKeywords = [
      'actor', 'actress', 'singer', 'musician', 'director', 'producer',
      'writer', 'comedian', 'model', 'celebrity', 'film', 'movie', 'television',
      'hollywood', 'bollywood', 'entertainer', 'performer', 'artist',
      'rapper', 'songwriter', 'composer', 'dancer', 'tv personality',
      'host', 'presenter', 'star'
    ];

    return celebrityKeywords.some(keyword => lowerText.includes(keyword));
  }

  private extractProfession(description: string): string[] {
    const professions: string[] = [];
    const lowerDesc = description.toLowerCase();

    const professionMap: { [key: string]: string } = {
      'actor': 'Actor',
      'actress': 'Actress',
      'singer': 'Singer',
      'musician': 'Musician',
      'director': 'Director',
      'producer': 'Producer',
      'writer': 'Writer',
      'comedian': 'Comedian',
      'model': 'Model',
      'rapper': 'Rapper',
      'songwriter': 'Songwriter',
      'composer': 'Composer',
      'dancer': 'Dancer'
    };

    Object.entries(professionMap).forEach(([key, value]) => {
      if (lowerDesc.includes(key)) {
        professions.push(value);
      }
    });

    return professions.length > 0 ? professions : ['Celebrity'];
  }

  private mapWikipediaToCelebrity(page: any): Celebrity {
    return {
      id: `wiki_${page.pageid || page.title.replace(/\s/g, '_')}`,
      name: page.title,
      profession: this.extractProfession(page.description || page.extract || ''),
      imageUrl: page.thumbnail?.source || page.originalimage?.source || '/assets/images/placeholder.jpg',
      description: page.extract,
      source: 'wikipedia'
    };
  }
}