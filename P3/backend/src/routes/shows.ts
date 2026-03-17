import express, { Response } from 'express';
import { query } from '../db';
import tmdbService from '../services/tmdb';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Search shows
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q, page = 1 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const tmdbResults = await tmdbService.searchShows(q, Number(page));

    // Transform TMDB results
    const shows = tmdbResults.results.map((show: any) => ({
      tmdb_id: show.id,
      title: show.name,
      description: show.overview,
      poster_url: tmdbService.imageUrl(show.poster_path),
      backdrop_url: tmdbService.imageUrl(show.backdrop_path, 'w1280'),
      first_air_date: show.first_air_date,
      average_rating: show.vote_average,
      vote_count: show.vote_count,
    }));

    res.json({
      results: shows,
      page: tmdbResults.page,
      total_pages: tmdbResults.total_pages,
      total_results: tmdbResults.total_results,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get show by ID
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const showId = parseInt(req.params.id);

    // Check if show exists in database
    let showResult = await query('SELECT * FROM shows WHERE id = $1', [showId]);

    let show;
    if (showResult.rows.length === 0) {
      // Try to find by tmdb_id
      const tmdbResult = await query('SELECT * FROM shows WHERE tmdb_id = $1', [showId]);
      if (tmdbResult.rows.length > 0) {
        show = tmdbResult.rows[0];
      } else {
        // Fetch from TMDB and store
        const tmdbShow = await tmdbService.getShowDetails(showId);
        show = await syncShowFromTMDB(tmdbShow);
      }
    } else {
      show = showResult.rows[0];
    }

    // Get user's rating if authenticated
    let userRating = null;
    if (req.userId) {
      const ratingResult = await query(
        'SELECT rating FROM show_ratings WHERE user_id = $1 AND show_id = $2',
        [req.userId, show.id]
      );
      if (ratingResult.rows.length > 0) {
        userRating = ratingResult.rows[0].rating;
      }
    }

    // Get average rating
    const avgRatingResult = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count FROM show_ratings WHERE show_id = $1',
      [show.id]
    );

    res.json({
      ...show,
      user_rating: userRating,
      average_rating: avgRatingResult.rows[0]?.avg_rating || null,
      rating_count: parseInt(avgRatingResult.rows[0]?.rating_count || '0'),
    });
  } catch (error) {
    console.error('Get show error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get show seasons
router.get('/:id/seasons', async (req: AuthRequest, res: Response) => {
  try {
    const showId = parseInt(req.params.id);

    // Get show to find tmdb_id
    let showResult = await query('SELECT tmdb_id FROM shows WHERE id = $1', [showId]);
    if (showResult.rows.length === 0) {
      showResult = await query('SELECT tmdb_id FROM shows WHERE tmdb_id = $1', [showId]);
    }

    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const tmdbId = showResult.rows[0].tmdb_id;

    // Get seasons from database
    let seasonsResult = await query(
      'SELECT * FROM seasons WHERE show_id = $1 ORDER BY season_number',
      [showId]
    );

    if (seasonsResult.rows.length === 0) {
      // Sync from TMDB
      const tmdbSeasons = await tmdbService.getShowSeasons(tmdbId);
      for (const tmdbSeason of tmdbSeasons) {
        await syncSeasonFromTMDB(showId, tmdbId, tmdbSeason);
      }
      seasonsResult = await query(
        'SELECT * FROM seasons WHERE show_id = $1 ORDER BY season_number',
        [showId]
      );
    }

    // Get episode counts and user progress if authenticated
    const seasons = await Promise.all(
      seasonsResult.rows.map(async (season) => {
        const episodeCountResult = await query(
          'SELECT COUNT(*) as count FROM episodes WHERE season_id = $1',
          [season.id]
        );
        const episodeCount = parseInt(episodeCountResult.rows[0]?.count || '0');

        let watchedCount = 0;
        if (req.userId) {
          const watchedResult = await query(
            `SELECT COUNT(*) as count FROM episode_logs el
             JOIN episodes e ON el.episode_id = e.id
             WHERE e.season_id = $1 AND el.user_id = $2`,
            [season.id, req.userId]
          );
          watchedCount = parseInt(watchedResult.rows[0]?.count || '0');
        }

        return {
          ...season,
          episode_count: episodeCount,
          watched_count: watchedCount,
        };
      })
    );

    res.json({ seasons });
  } catch (error) {
    console.error('Get seasons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get season episodes
router.get('/:id/seasons/:seasonNumber/episodes', async (req: AuthRequest, res: Response) => {
  try {
    const showId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);

    // Get show tmdb_id
    let showResult = await query('SELECT tmdb_id FROM shows WHERE id = $1', [showId]);
    if (showResult.rows.length === 0) {
      showResult = await query('SELECT tmdb_id FROM shows WHERE tmdb_id = $1', [showId]);
    }

    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const tmdbId = showResult.rows[0].tmdb_id;

    // Get season
    let seasonResult = await query(
      'SELECT * FROM seasons WHERE show_id = $1 AND season_number = $2',
      [showId, seasonNumber]
    );

    if (seasonResult.rows.length === 0) {
      // Sync from TMDB
      const tmdbSeason = await tmdbService.getSeasonDetails(tmdbId, seasonNumber);
      await syncSeasonFromTMDB(showId, tmdbId, tmdbSeason);
      seasonResult = await query(
        'SELECT * FROM seasons WHERE show_id = $1 AND season_number = $2',
        [showId, seasonNumber]
      );
    }

    if (seasonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Season not found' });
    }

    const season = seasonResult.rows[0];

    // Get episodes
    let episodesResult = await query(
      'SELECT * FROM episodes WHERE season_id = $1 ORDER BY episode_number',
      [season.id]
    );

    if (episodesResult.rows.length === 0) {
      // Sync from TMDB
      const tmdbSeason = await tmdbService.getSeasonDetails(tmdbId, seasonNumber);
      for (const tmdbEpisode of tmdbSeason.episodes || []) {
        await syncEpisodeFromTMDB(season.id, tmdbEpisode);
      }
      episodesResult = await query(
        'SELECT * FROM episodes WHERE season_id = $1 ORDER BY episode_number',
        [season.id]
      );
    }

    // Get user logs if authenticated
    const episodes = await Promise.all(
      episodesResult.rows.map(async (episode) => {
        let userLog = null;
        if (req.userId) {
          const logResult = await query(
            'SELECT * FROM episode_logs WHERE user_id = $1 AND episode_id = $2',
            [req.userId, episode.id]
          );
          if (logResult.rows.length > 0) {
            userLog = logResult.rows[0];
          }
        }

        return {
          ...episode,
          user_log: userLog,
        };
      })
    );

    res.json({ episodes });
  } catch (error) {
    console.error('Get episodes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trending shows
router.get('/trending', async (req: AuthRequest, res: Response) => {
  try {
    const { time_window = 'week' } = req.query;
    const tmdbResults = await tmdbService.getTrendingShows(
      time_window as 'day' | 'week'
    );

    const shows = tmdbResults.results.map((show: any) => ({
      tmdb_id: show.id,
      title: show.name,
      description: show.overview,
      poster_url: tmdbService.imageUrl(show.poster_path),
      backdrop_url: tmdbService.imageUrl(show.backdrop_path, 'w1280'),
      first_air_date: show.first_air_date,
      average_rating: show.vote_average,
    }));

    res.json({ results: shows });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions to sync data from TMDB
async function syncShowFromTMDB(tmdbShow: any) {
  const genres = tmdbShow.genres?.map((g: any) => g.name) || [];

  const result = await query(
    `INSERT INTO shows (tmdb_id, title, description, poster_url, backdrop_url, 
      first_air_date, last_air_date, network, genres, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (tmdb_id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       poster_url = EXCLUDED.poster_url,
       backdrop_url = EXCLUDED.backdrop_url,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      tmdbShow.id,
      tmdbShow.name,
      tmdbShow.overview,
      tmdbService.imageUrl(tmdbShow.poster_path),
      tmdbService.imageUrl(tmdbShow.backdrop_path, 'w1280'),
      tmdbShow.first_air_date || null,
      tmdbShow.last_air_date || null,
      tmdbShow.networks?.[0]?.name || null,
      genres,
      tmdbShow.status || null,
    ]
  );

  return result.rows[0];
}

async function syncSeasonFromTMDB(showId: number, tmdbId: number, tmdbSeason: any) {
  const result = await query(
    `INSERT INTO seasons (show_id, season_number, name, description, poster_url, 
      air_date, episode_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (show_id, season_number) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       poster_url = EXCLUDED.poster_url,
       episode_count = EXCLUDED.episode_count
     RETURNING *`,
    [
      showId,
      tmdbSeason.season_number,
      tmdbSeason.name,
      tmdbSeason.overview,
      tmdbService.imageUrl(tmdbSeason.poster_path),
      tmdbSeason.air_date || null,
      tmdbSeason.episode_count || 0,
    ]
  );

  return result.rows[0];
}

async function syncEpisodeFromTMDB(seasonId: number, tmdbEpisode: any) {
  const result = await query(
    `INSERT INTO episodes (season_id, episode_number, title, description, runtime, 
      air_date, still_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (season_id, episode_number) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       runtime = EXCLUDED.runtime,
       air_date = EXCLUDED.air_date,
       still_url = EXCLUDED.still_url
     RETURNING *`,
    [
      seasonId,
      tmdbEpisode.episode_number,
      tmdbEpisode.name,
      tmdbEpisode.overview,
      tmdbEpisode.runtime || null,
      tmdbEpisode.air_date || null,
      tmdbService.imageUrl(tmdbEpisode.still_path),
    ]
  );

  return result.rows[0];
}

export default router;
