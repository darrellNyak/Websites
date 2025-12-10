import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
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