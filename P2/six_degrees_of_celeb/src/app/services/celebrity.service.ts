import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Celebrity, ConnectionPath } from '../models/celebrity';
import { TmdbService } from './tmdb.service';
import { WikipediaService } from './wikipedia.service';

@Injectable({
  providedIn: 'root'
})
export class CelebrityService {
  // Map of celebrity ID -> array of celebrity IDs they've worked with
  private connectionGraph = new Map<string, Set<string>>();
  
  // Map of celebrity ID -> Celebrity object
  private celebrityCache = new Map<string, Celebrity>();
  
  // Map of celebrity ID -> array of movie IDs they've been in
  private movieCreditsCache = new Map<string, number[]>();
  
  // Cache for search results
  private searchCache = new Map<string, Celebrity[]>();

  //Movie connections between celebrity pairs
  private movieConnectionsMap = new Map<string, number>();

  constructor(
    private tmdbService: TmdbService,
    private wikipediaService: WikipediaService,
    private http: HttpClient
  ) {}

  searchCelebrities(query: string): Observable<Celebrity[]> {
    const cacheKey = query.toLowerCase();
    
    if (this.searchCache.has(cacheKey)) {
      return of(this.searchCache.get(cacheKey)!);
    }

    return this.tmdbService.searchCelebrities(query).pipe(
      map(response => response.celebrities),
      tap(celebrities => {
        celebrities.forEach(celebrity => {
          this.cacheCelebrity(celebrity);
        });
        this.searchCache.set(cacheKey, celebrities);
      }),
      catchError(error => {
        console.error('TMDB search failed, falling back to Wikipedia', error);
        return this.wikipediaService.searchCelebrities(query);
      })
    );
  }

  getPopularCelebrities(): Observable<Celebrity[]> {
    return this.tmdbService.getPopularCelebrities().pipe(
      tap(celebrities => {
        celebrities.forEach(celebrity => this.cacheCelebrity(celebrity));
      })
    );
  }

  getCelebrityDetails(id: string): Observable<Celebrity> {
    if (this.celebrityCache.has(id)) {
      return of(this.celebrityCache.get(id)!);
    }

    if (id.startsWith('tmdb_')) {
      const tmdbId = id.replace('tmdb_', '');
      return this.tmdbService.getCelebrityDetails(tmdbId).pipe(
        tap(celebrity => this.cacheCelebrity(celebrity))
      );
    }

    if (id.startsWith('wiki_')) {
      const wikiTitle = id.replace('wiki_', '');
      return this.wikipediaService.getCelebrityDetails(wikiTitle).pipe(
        tap(celebrity => this.cacheCelebrity(celebrity))
      );
    }

    // Fallback to creating a basic celebrity object
    return of(this.createFallbackCelebrity(id));
  }

  /**
 * Get celebrity details along with their movie credits
 */
  private getCelebrityWithCredits(id: string): Observable<Celebrity> {
    return this.getCelebrityDetails(id).pipe(
      switchMap(celebrity => {
        if (id.startsWith('tmdb_')) {
          const tmdbId = id.replace('tmdb_', '');
          return this.tmdbService.getCelebrityCredits(tmdbId).pipe(
            tap(credits => {
              // Store movie IDs this celebrity has been in
              const movieIds = credits.cast.map((c: any) => c.id);
              this.movieCreditsCache.set(id, movieIds);
              console.log(`${celebrity.name} has been in ${movieIds.length} movies`);
            }),
            map(() => celebrity),
            catchError(error => {
              console.error(`Failed to load credits for ${celebrity.name}`, error);
              return of(celebrity);
            })
          );
        }
        return of(celebrity);
      })
    );
  }

  /**
   * Find the shortest connection path between two celebrities using BFS
   * This implements the Six Degrees of Separation algorithm
   */
  findConnection(startId: string, endId: string): Observable<ConnectionPath | null> {
    console.log(`Finding connection from ${startId} to ${endId}`);
    
    return forkJoin([
      this.getCelebrityWithCredits(startId),
      this.getCelebrityWithCredits(endId)
    ]).pipe(
      switchMap(([start, end]) => {
        console.log('Start celebrity loaded:', start);
        console.log('End celebrity loaded:', end);
        
        return this.buildConnectionGraph(startId, endId, 3).pipe(
          switchMap(() => {
            console.log('Connection graph built, searching for path...');
            const path = this.findShortestPath(startId, endId);
            
            if (path) {
              console.log('Path found:', path);
              
              const missingIds = path.filter(id => !this.celebrityCache.has(id));
              
              if (missingIds.length > 0) {
                console.log("Fetching missing celebrities:", missingIds);
                
                const fetchObservables = missingIds.map(id => 
                  this.getCelebrityDetails(id).pipe(
                    catchError(error => {
                      console.error(`Failed to fetch celebrity ${id}:`, error);
                      return of({
                        id: id,
                        name: `Celebrity ${id.replace('tmdb_', '')}`,
                        profession: ['Actor'],
                        imageUrl: '',
                        source: 'tmdb' as const
                      });
                    })
                  )
                );
                
                return forkJoin(fetchObservables).pipe(
                  switchMap(() => this.buildConnectionPathWithMovies(path))
                );
              }
              
              return this.buildConnectionPathWithMovies(path);
            }
            
            console.log('No path found');
            return of(null);
          })
        );
      }),
      catchError(error => {
        console.error('Error finding connection:', error);
        return of(null);
      })
    );
  }

  // ADD THIS NEW METHOD
  private buildConnectionPathWithMovies(path: string[]): Observable<ConnectionPath | null> {
    const celebrityPath = path.map(id => this.celebrityCache.get(id)!).filter(c => c);
    
    if (celebrityPath.length !== path.length) {
      console.log('Failed to load all celebrities in path');
      return of(null);
    }
    
    // Get movie connections between each pair
    const movieFetchObservables: Observable<any>[] = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const celeb1 = path[i];
      const celeb2 = path[i + 1];
      const connectionKey = this.getConnectionKey(celeb1, celeb2);
      const movieId = this.movieConnectionsMap.get(connectionKey);
      
      if (movieId) {
        movieFetchObservables.push(
          this.tmdbService.getMovieDetails(movieId).pipe(
            map(movie => ({
              movie: {
                id: movieId,
                title: movie?.title || 'Unknown Movie',
                year: movie?.release_date ? new Date(movie.release_date).getFullYear() : undefined,
                poster: movie?.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : undefined
              },
              connectingCelebrities: [celeb1, celeb2]
            })),
            catchError(() => of({
              movie: {
                id: movieId,
                title: `Movie ${movieId}`,
                year: undefined,
                poster: undefined
              },
              connectingCelebrities: [celeb1, celeb2]
            }))
          )
        );
      }
    }
    
    if (movieFetchObservables.length === 0) {
      return of({
        path: celebrityPath,
        degrees: celebrityPath.length - 1,
        totalConnections: this.calculateTotalConnections(path),
        movies: []
      });
    }
    
    return forkJoin(movieFetchObservables).pipe(
      map(movies => ({
        path: celebrityPath,
        degrees: celebrityPath.length - 1,
        totalConnections: this.calculateTotalConnections(path),
        movies: movies
      }))
    );
  }

  /**
   * Dynamically build the connection graph by exploring movies
   * maxDepth controls how many degrees we explore (3 = up to 6 degrees)
   */
  private buildConnectionGraph(startId: string, endId: string, maxDepth: number): Observable<void> {
    const explored = new Set<string>();
    const queue: { id: string; depth: number }[] = [
      { id: startId, depth: 0 },
      { id: endId, depth: 0 }
    ];

    const processQueue = (): Observable<void> => {
      if (queue.length === 0) {
        return of(void 0);
      }

      const current = queue.shift()!;
      
      if (explored.has(current.id) || current.depth >= maxDepth) {
        return processQueue();
      }

      explored.add(current.id);

      // Get the movies this celebrity has been in
      const movieIds = this.movieCreditsCache.get(current.id) || [];
      
      if (movieIds.length === 0) {
        return processQueue();
      }

      // For each movie, get the cast and add connections
      const movieObservables = movieIds.slice(0, 20).map(movieId =>
        this.tmdbService.getMovieCredits(movieId).pipe(
          tap(credits => {
            // Get all actors in this movie
            const castIds = credits.cast
              .slice(0, 15)
              .map(c => `tmdb_${c.id}`);

            // Add connections between all cast members (they worked together)
            castIds.forEach(castId => {
              if (!this.connectionGraph.has(castId)) {
                this.connectionGraph.set(castId, new Set());
              }
              
              // Add all other cast members as connections
              castIds.forEach(otherId => {
                if (castId !== otherId) {
                  this.connectionGraph.get(castId)!.add(otherId);
                  
                  // TRACK THE MOVIE THAT CONNECTS THEM
                  const connectionKey = this.getConnectionKey(castId, otherId);
                  if (!this.movieConnectionsMap.has(connectionKey)) {
                    this.movieConnectionsMap.set(connectionKey, movieId);
                  }
                }
              });

              // Add to queue for further exploration
              if (!explored.has(castId) && current.depth + 1 < maxDepth) {
                queue.push({ id: castId, depth: current.depth + 1 });
              }
            });
          }),
          catchError(error => {
            console.error(`Failed to load movie credits for movie ${movieId}`, error);
            return of(null);
          })
        )
      );

      // Process all movies, then continue with queue
      return forkJoin(movieObservables.length > 0 ? movieObservables : [of(null)]).pipe(
        switchMap(() => processQueue())
      );
    };

    return processQueue();
  }

  // ADD THIS HELPER METHOD
  private getConnectionKey(celeb1: string, celeb2: string): string {
    // Create a consistent key regardless of order
    return [celeb1, celeb2].sort().join('_');
  }

  /**
   * Find shortest path using Breadth-First Search (BFS)
   * This guarantees the shortest connection (fewest degrees of separation)
   */
  private findShortestPath(startId: string, endId: string): string[] | null {
    if (startId === endId) {
      return [startId];
    }

    const visited = new Set<string>();
    const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.id === endId) {
        console.log(`Found path with ${current.path.length - 1} degrees of separation`);
        return current.path;
      }

      if (!visited.has(current.id)) {
        visited.add(current.id);
        const connections = Array.from(this.connectionGraph.get(current.id) || []);

        for (const connectionId of connections) {
          if (!visited.has(connectionId)) {
            queue.push({
              id: connectionId,
              path: [...current.path, connectionId]
            });
          }
        }
      }
    }

    return null;
  }

  private cacheCelebrity(celebrity: Celebrity): void {
    this.celebrityCache.set(celebrity.id, celebrity);
  }

  private createFallbackCelebrity(id: string): Celebrity {
    return {
      id,
      name: 'Unknown Celebrity',
      profession: ['Actor'],
      imageUrl: '',
      source: 'manual'
    };
  }

  private calculateTotalConnections(path: string[]): number {
    return path.reduce((total, celebrityId, index) => {
      if (index < path.length - 1) {
        const connections = this.connectionGraph.get(celebrityId) || new Set();
        return total + connections.size;
      }
      return total;
    }, 0);
  }
}