import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap, timeout, retry } from 'rxjs/operators';
import { Celebrity, ConnectionPath } from '../models/celebrity';
import { TmdbService } from './tmdb.service';
import { WikipediaService } from './wikipedia.service';

@Injectable({
  providedIn: 'root',
})
export class CelebrityService {
  private connectionGraph = new Map<string, Set<string>>();
  private celebrityCache = new Map<string, Celebrity>();
  private movieCreditsCache = new Map<string, number[]>();
  private tvCreditsCache = new Map<string, number[]>(); // NEW: TV show cache
  private searchCache = new Map<string, Celebrity[]>();
  private mediaConnectionsMap = new Map<string, { id: number; type: 'movie' | 'tv' }>(); // UPDATED: Track both movies and TV
  /*New*/ private currentMaxDepth = 3;

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
      map((response) => response.celebrities),
      tap((celebrities) => {
        celebrities.forEach((celebrity) => {
          this.cacheCelebrity(celebrity);
        });
        this.searchCache.set(cacheKey, celebrities);
      }),
      catchError((error) => {
        console.error('TMDB search failed, falling back to Wikipedia', error);
        return this.wikipediaService.searchCelebrities(query);
      })
    );
  }

  getPopularCelebrities(): Observable<Celebrity[]> {
    return this.tmdbService.getPopularCelebrities().pipe(
      tap((celebrities) => {
        celebrities.forEach((celebrity) => this.cacheCelebrity(celebrity));
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
        tap((celebrity) => this.cacheCelebrity(celebrity)),
        catchError((error) => {
          console.error('TMDB getCelebrityDetails failed, trying Wikipedia', error);
          return this.wikipediaService
            .getCelebrityDetails(tmdbId)
            .pipe(tap((celebrity) => this.cacheCelebrity(celebrity)));
        })
      );
    }

    if (id.startsWith('wiki_')) {
      const wikiTitle = id.replace('wiki_', '');
      return this.wikipediaService
        .getCelebrityDetails(wikiTitle)
        .pipe(tap((celebrity) => this.cacheCelebrity(celebrity)));
    }

    return of(this.createFallbackCelebrity(id));
  }

  /**
   * UPDATED: Get celebrity details along with BOTH movie AND TV credits
   */
  private getCelebrityWithCredits(id: string): Observable<Celebrity> {
    return this.getCelebrityDetails(id).pipe(
      switchMap((celebrity) => {
        if (id.startsWith('tmdb_')) {
          const tmdbId = id.replace('tmdb_', '');

          // Fetch BOTH movie and TV credits
          return forkJoin({
            movieCredits: this.tmdbService
              .getCelebrityCredits(tmdbId)
              .pipe(catchError(() => of({ cast: [] }))),
            tvCredits: this.tmdbService
              .getCelebrityTVCredits(tmdbId)
              .pipe(catchError(() => of({ cast: [] }))),
          }).pipe(
            tap(({ movieCredits, tvCredits }) => {
              const movieIds = movieCredits.cast.map((c: any) => c.id);
              const tvIds = tvCredits.cast.map((c: any) => c.id);

              this.movieCreditsCache.set(id, movieIds);
              this.tvCreditsCache.set(id, tvIds);

              console.log(
                `${celebrity.name} has been in ${movieIds.length} movies and ${tvIds.length} TV shows`
              );
            }),
            map(() => celebrity),
            catchError((error) => {
              console.error(`Failed to load credits for ${celebrity.name}`, error);
              return of(celebrity);
            })
          );
        }
        return of(celebrity);
      })
    );
  }
  //New
  findConnection(startId: string, endId: string): Observable<ConnectionPath | null> {
    console.log(`Finding connection from ${startId} to ${endId}`);

    return forkJoin([
      this.getCelebrityWithCredits(startId),
      this.getCelebrityWithCredits(endId),
    ]).pipe(
      switchMap(([start, end]) => {
        console.log('Start celebrity loaded:', start);
        console.log('End celebrity loaded:', end);

        return this.buildConnectionGraph(startId, endId, 6).pipe(
          timeout(60000),
          switchMap(() => {
            console.log('Connection graph built, searching for path...');
            const path = this.findShortestPath(startId, endId);

            if (path) {
              console.log('Path found:', path);

              const missingIds = path.filter((id) => !this.celebrityCache.has(id));

              if (missingIds.length > 0) {
                console.log('Fetching missing celebrities:', missingIds);

                const fetchObservables = missingIds.map((id) =>
                  this.getCelebrityDetails(id).pipe(
                    catchError((error) => {
                      console.error(`Failed to fetch celebrity ${id}:`, error);
                      return of({
                        id: id,
                        name: `Celebrity ${id.replace('tmdb_', '')}`,
                        profession: ['Actor'],
                        imageUrl: '',
                        source: 'tmdb' as const,
                      });
                    })
                  )
                );

                return forkJoin(fetchObservables).pipe(
                  switchMap(() => this.buildConnectionPathWithMedia(path))
                );
              }

              return this.buildConnectionPathWithMedia(path);
            }

            console.log(`No path found in TMDB between ${start.name} and ${end.name}`);
            console.log(`Graph explored: ${this.connectionGraph.size} celebrities`);

            const startRegion = this.detectFilmRegion(start);
            const endRegion = this.detectFilmRegion(end);

            if (startRegion !== endRegion && startRegion !== 'unknown' && endRegion !== 'unknown') {
              console.log(`Different film industries detected: ${startRegion} vs ${endRegion}`);
              console.log('This is likely a legitimate "no connection" case');
            }

            console.log('Trying Wikipedia fallback...');
            return this.findConnectionViaWikipedia(start, end);
          }),
          catchError((error) => {
            console.error('TMDB connection search failed, trying Wikipedia', error);
            return this.getCelebrityDetails(startId).pipe(
              switchMap((start) =>
                this.getCelebrityDetails(endId).pipe(
                  switchMap((end) => this.findConnectionViaWikipedia(start, end))
                )
              )
            );
          })
        );
      }),
      catchError((error) => {
        console.error('Error finding connection:', error);
        return of(null);
      })
    );
  }

  findConnectionWithDepth(
    startId: string,
    endId: string,
    maxDepth: number
  ): Observable<ConnectionPath | null> {
    console.log(`Finding connection from ${startId} to ${endId} with max depth ${maxDepth}`);

    return forkJoin([
      this.getCelebrityWithCredits(startId),
      this.getCelebrityWithCredits(endId),
    ]).pipe(
      switchMap(([start, end]) => {
        console.log('Start celebrity loaded:', start);
        console.log('End celebrity loaded:', end);

        // First try TMDB at this depth
        return this.buildConnectionGraph(startId, endId, maxDepth).pipe(
          timeout(60000),
          switchMap(() => {
            console.log('Connection graph built, searching for path...');
            const path = this.findShortestPath(startId, endId);

            if (path) {
              console.log('Path found in TMDB:', path);

              const missingIds = path.filter((id) => !this.celebrityCache.has(id));

              if (missingIds.length > 0) {
                console.log('Fetching missing celebrities:', missingIds);

                const fetchObservables = missingIds.map((id) =>
                  this.getCelebrityDetails(id).pipe(
                    catchError((error) => {
                      console.error(`Failed to fetch celebrity ${id}:`, error);
                      return of({
                        id: id,
                        name: `Celebrity ${id.replace('tmdb_', '')}`,
                        profession: ['Actor'],
                        imageUrl: '',
                        source: 'tmdb' as const,
                      });
                    })
                  )
                );

                return forkJoin(fetchObservables).pipe(
                  switchMap(() => this.buildConnectionPathWithMedia(path))
                );
              }

              return this.buildConnectionPathWithMedia(path);
            }

            // TMDB found nothing at this depth, try Wikipedia
            console.log(`No TMDB path found at depth ${maxDepth}, trying Wikipedia...`);
            return this.findConnectionViaWikipedia(start, end).pipe(
              switchMap((wikiPath) => {
                if (wikiPath) {
                  console.log('Wikipedia found a connection!');
                  return of(wikiPath);
                }

                // Both TMDB and Wikipedia failed at this depth
                console.log(`No path found at depth ${maxDepth} in either TMDB or Wikipedia`);
                return of(null);
              })
            );
          }),
          catchError((error) => {
            // TMDB error, immediately try Wikipedia
            console.error(`TMDB search failed at depth ${maxDepth}, trying Wikipedia`, error);
            return this.findConnectionViaWikipedia(start, end).pipe(
              catchError((wikiError) => {
                console.error('Wikipedia also failed:', wikiError);
                return of(null);
              })
            );
          })
        );
      }),
      catchError((error) => {
        console.error('Error finding connection:', error);
        return of(null);
      })
    );
  }

  private findConnectionViaWikipedia(
    start: Celebrity,
    end: Celebrity
  ): Observable<ConnectionPath | null> {
    console.log('Attempting Wikipedia connection search...');

    // Wikipedia works best with clean names (no disambiguation)
    const cleanStartName = start.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    const cleanEndName = end.name.replace(/\s*\(.*?\)\s*/g, '').trim();

    return this.wikipediaService.findConnection(cleanStartName, cleanEndName).pipe(
      map((wikiPath) => {
        if (!wikiPath || wikiPath.length === 0) {
          console.log('Wikipedia returned no path');
          return null;
        }

        console.log(`Wikipedia found ${wikiPath.length - 1} degree connection:`, wikiPath);

        // Convert Wikipedia path to ConnectionPath format
        const celebrities: Celebrity[] = wikiPath.map((name, index) => ({
          id: `wiki_${name.replace(/\s/g, '_')}`,
          name: name,
          profession: ['Actor'],
          imageUrl: '/assets/images/placeholder.jpg',
          source: 'wikipedia' as const,
        }));

        return {
          path: celebrities,
          degrees: celebrities.length - 1,
          totalConnections: 0,
          movies: [],
        };
      }),
      catchError((error) => {
        console.error('Wikipedia search error:', error);
        return of(null);
      })
    );
  }

  /**
   * UPDATED: Build connection path with both movies AND TV shows
   */
  private buildConnectionPathWithMedia(path: string[]): Observable<ConnectionPath | null> {
    const celebrityPath = path.map((id) => this.celebrityCache.get(id)!).filter((c) => c);

    if (celebrityPath.length !== path.length) {
      console.log('Failed to load all celebrities in path');
      return of(null);
    }

    const mediaFetchObservables: Observable<any>[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const celeb1 = path[i];
      const celeb2 = path[i + 1];
      const connectionKey = this.getConnectionKey(celeb1, celeb2);
      const mediaInfo = this.mediaConnectionsMap.get(connectionKey);

      if (mediaInfo) {
        if (mediaInfo.type === 'movie') {
          mediaFetchObservables.push(
            this.tmdbService.getMovieDetails(mediaInfo.id).pipe(
              map((movie) => ({
                movie: {
                  id: mediaInfo.id,
                  title: movie?.title || 'Unknown Movie',
                  year: movie?.release_date
                    ? new Date(movie.release_date).getFullYear()
                    : undefined,
                  poster: movie?.poster_path
                    ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                    : undefined,
                },
                connectingCelebrities: [celeb1, celeb2],
              })),
              catchError(() =>
                of({
                  movie: {
                    id: mediaInfo.id,
                    title: `Movie ${mediaInfo.id}`,
                    year: undefined,
                    poster: undefined,
                  },
                  connectingCelebrities: [celeb1, celeb2],
                })
              )
            )
          );
        } else {
          // Fetch TV show details
          mediaFetchObservables.push(
            this.tmdbService.getTVShowDetails(mediaInfo.id).pipe(
              map((tvShow) => ({
                movie: {
                  id: mediaInfo.id,
                  title: tvShow?.name || 'Unknown TV Show',
                  year: tvShow?.first_air_date
                    ? new Date(tvShow.first_air_date).getFullYear()
                    : undefined,
                  poster: tvShow?.poster_path
                    ? `https://image.tmdb.org/t/p/w200${tvShow.poster_path}`
                    : undefined,
                },
                connectingCelebrities: [celeb1, celeb2],
              })),
              catchError(() =>
                of({
                  movie: {
                    id: mediaInfo.id,
                    title: `TV Show ${mediaInfo.id}`,
                    year: undefined,
                    poster: undefined,
                  },
                  connectingCelebrities: [celeb1, celeb2],
                })
              )
            )
          );
        }
      }
    }

    if (mediaFetchObservables.length === 0) {
      return of({
        path: celebrityPath,
        degrees: celebrityPath.length - 1,
        totalConnections: this.calculateTotalConnections(path),
        movies: [],
      });
    }

    return forkJoin(mediaFetchObservables).pipe(
      map((media) => ({
        path: celebrityPath,
        degrees: celebrityPath.length - 1,
        totalConnections: this.calculateTotalConnections(path),
        movies: media,
      }))
    );
  }

  /**
   * UPDATED: Build connection graph from BOTH movies AND TV shows
   */
  private buildConnectionGraph(startId: string, endId: string, maxDepth: number): Observable<void> {
    const explored = new Set<string>();
    const queue: { id: string; depth: number }[] = [
      { id: startId, depth: 0 },
      { id: endId, depth: 0 },
    ];

    let totalMoviesChecked = 0;
    let totalTVShowsChecked = 0;
    let totalConnectionsFound = 0;
    let failedRequests = 0;

    const processQueue = (): Observable<void> => {
      if (queue.length === 0) {
        console.log(`Graph building complete:
          - Total movies checked: ${totalMoviesChecked}
          - Total TV shows checked: ${totalTVShowsChecked}
          - Total connections found: ${totalConnectionsFound}
          - Failed requests: ${failedRequests}
          - Graph size: ${this.connectionGraph.size} celebrities`);
        return of(void 0);
      }

      const current = queue.shift()!;

      if (explored.has(current.id) || current.depth >= maxDepth) {
        return processQueue();
      }

      explored.add(current.id);

      const movieIds = this.movieCreditsCache.get(current.id) || [];
      const tvIds = this.tvCreditsCache.get(current.id) || [];

      if (movieIds.length === 0 && tvIds.length === 0) {
        return processQueue();
      }

      const mediaLimit = current.depth <= 2 ? 50 : 30;
      const moviesToCheck = movieIds.slice(0, mediaLimit);
      const tvShowsToCheck = tvIds.slice(0, mediaLimit);

      totalMoviesChecked += moviesToCheck.length;
      totalTVShowsChecked += tvShowsToCheck.length;

      // Process movies
      const movieObservables = moviesToCheck.map((movieId) =>
        this.tmdbService.getMovieCredits(movieId).pipe(
          tap((credits) => {
            const castIds = credits.cast.slice(0, 20).map((c) => `tmdb_${c.id}`);
            totalConnectionsFound += this.addConnections(
              castIds,
              movieId,
              'movie',
              explored,
              current.depth,
              maxDepth,
              queue
            );
          }),
          catchError((error) => {
            if (error.status !== 404) {
              console.warn(`Failed to load movie ${movieId}: ${error.status}`);
            }
            failedRequests++;
            return of(null);
          })
        )
      );

      // Process TV shows
      const tvObservables = tvShowsToCheck.map((tvId) =>
        this.tmdbService.getTVShowCredits(tvId).pipe(
          tap((credits) => {
            const castIds = credits.cast.slice(0, 20).map((c) => `tmdb_${c.id}`);
            totalConnectionsFound += this.addConnections(
              castIds,
              tvId,
              'tv',
              explored,
              current.depth,
              maxDepth,
              queue
            );
          }),
          catchError((error) => {
            if (error.status !== 404) {
              console.warn(`Failed to load TV show ${tvId}: ${error.status}`);
            }
            failedRequests++;
            return of(null);
          })
        )
      );

      const allObservables = [...movieObservables, ...tvObservables];

      return forkJoin(allObservables.length > 0 ? allObservables : [of(null)]).pipe(
        switchMap(() => processQueue())
      );
    };

    return processQueue();
  }

  /**
   * NEW: Helper method to add connections to the graph
   */
  private addConnections(
    castIds: string[],
    mediaId: number,
    mediaType: 'movie' | 'tv',
    explored: Set<string>,
    currentDepth: number,
    maxDepth: number,
    queue: { id: string; depth: number }[]
  ): number {
    let connectionsAdded = 0;

    castIds.forEach((castId) => {
      if (!this.connectionGraph.has(castId)) {
        this.connectionGraph.set(castId, new Set());
      }

      castIds.forEach((otherId) => {
        if (castId !== otherId) {
          this.connectionGraph.get(castId)!.add(otherId);
          connectionsAdded++;

          const connectionKey = this.getConnectionKey(castId, otherId);
          if (!this.mediaConnectionsMap.has(connectionKey)) {
            this.mediaConnectionsMap.set(connectionKey, { id: mediaId, type: mediaType });
          }
        }
      });

      if (!explored.has(castId) && currentDepth + 1 < maxDepth) {
        queue.push({ id: castId, depth: currentDepth + 1 });
      }
    });

    return connectionsAdded;
  }

  private getConnectionKey(celeb1: string, celeb2: string): string {
    return [celeb1, celeb2].sort().join('_');
  }

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
              path: [...current.path, connectionId],
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
      source: 'manual',
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

  private detectFilmRegion(celebrity: Celebrity): string {
    const name = celebrity.name.toLowerCase();
    const profession = celebrity.profession.join(' ').toLowerCase();

    const southAsianNames = ['khan', 'kapoor', 'kumar', 'aziz', 'malik', 'shah', 'ahmed'];
    if (southAsianNames.some((n) => name.includes(n))) {
      return 'south-asian';
    }

    return celebrity.source === 'tmdb' ? 'hollywood' : 'unknown';
  }

  //*New*/ Add this helper method to clear caches when expanding search
  clearConnectionGraph(): void {
    this.connectionGraph.clear();
    this.mediaConnectionsMap.clear();
  }
}
