import express from 'express';
import axios from 'axios';

const router = express.Router();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

function getTmdbApiKey() {
  return process.env.TMDB_API_KEY;
}

// Search celebrities
router.get('/search', async (req, res) => {
  try {
    const TMDB_API_KEY = getTmdbApiKey();
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not set on the server' });
    }

    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    const response = await axios.get(url);
    
    const celebrities = response.data.results.map((person) => mapTmdbToCelebrity(person));
    
    res.json({
      celebrities,
      total: response.data.total_results,
      page: parseInt(page)
    });
  } catch (error) {
    console.error('TMDB search error:', error);
    res.status(500).json({ error: 'Failed to search celebrities' });
  }
});

// Get popular celebrities
router.get('/popular', async (req, res) => {
  try {
    const TMDB_API_KEY = getTmdbApiKey();
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not set on the server' });
    }

    const url = `${TMDB_BASE_URL}/person/popular?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    
    const celebrities = response.data.results.map((person) => mapTmdbToCelebrity(person));
    
    res.json(celebrities);
  } catch (error) {
    console.error('TMDB popular celebrities error:', error);
    res.status(500).json({ error: 'Failed to get popular celebrities' });
  }
});

// Get celebrity details
router.get('/person/:id', async (req, res) => {
  try {
    const TMDB_API_KEY = getTmdbApiKey();
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not set on the server' });
    }

    const { id } = req.params;
    const url = `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    
    const celebrity = mapTmdbToCelebrity(response.data, true);
    res.json(celebrity);
  } catch (error) {
    console.error(`TMDB celebrity details error for ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get celebrity details' });
  }
});

// Get celebrity credits (movies)
router.get('/person/:id/credits', async (req, res) => {
  try {
    const TMDB_API_KEY = getTmdbApiKey();
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not set on the server' });
    }

    const { id } = req.params;
    const url = `${TMDB_BASE_URL}/person/${id}/combined_credits?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    
    const credits = {
      cast: (response.data.cast || [])
        .filter((c) => c.media_type === 'movie')
        .map((c) => ({
          ...c,
          mediaType: 'movie'
        })),
      crew: (response.data.crew || []).map((c) => ({
        ...c,
        mediaType: c.media_type
      }))
    };
    
    res.json(credits);
  } catch (error) {
    console.error(`TMDB celebrity credits error for ID ${id}:`, error);
    res.status(500).json({ error: 'Failed to get celebrity credits' });
  }
});

// Get celebrity TV credits
router.get('/person/:id/tv-credits', async (req, res) => {
  try {
    const TMDB_API_KEY = getTmdbApiKey();
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not set on the server' });
    }

    const { id } = req.params;
    const url = `${TMDB_BASE_URL}/person/${id}/combined_credits?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    
    const credits = {
      cast: (response.data.cast || [])
        .filter((c) => c.media_type === 'tv')
        .map((c) => ({
          ...c,
          mediaType: 'tv'
        })),
      crew: (response.data.crew || [])
        .filter((c) => c.media_type === 'tv')
        .map((c) => ({
          ...c,
          mediaType: 'tv'
        }))
    };
    
    res.json(credits);
  } catch (error) {
    console.error(`TMDB TV credits error for ID ${id}:`, error);
    res.status(500).json({ error: 'Failed to get TV credits' });
  }
});

// Get movie credits
router.get('/movie/:id/credits', async (req, res) => {
  try {
    const TMDB_API_KEY = getTmdbApiKey();
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not set on the server' });
    }

    const { id } = req.params;
    const url = `${TMDB_BASE_URL}/movie/${id}/credits?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    
    res.json({
      cast: response.data.cast || [],
      crew: response.data.crew || []
    });
  } catch (error) {
    console.error(`TMDB movie credits error for movie ${id}:`, error);
    res.status(500).json({ error: 'Failed to get movie credits' });
  }
});

// Get TV show credits
router.get('/tv/:id/credits', async (req, res) => {
  try {
    const TMDB_API_KEY = getTmdbApiKey();
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not set on the server' });
    }

    const { id } = req.params;
    const url = `${TMDB_BASE_URL}/tv/${id}/credits?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    
    res.json({
      cast: (response.data.cast || []).map((c) => ({ ...c, mediaType: 'tv' })),
      crew: response.data.crew || []
    });
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error(`TMDB TV credits error for show ${id}:`, error);
    }
    res.status(error.response?.status || 500).json({ error: 'Failed to get TV show credits' });
  }
});

// Get movie details
router.get('/movie/:id', async (req, res) => {
  try {
    const TMDB_API_KEY = getTmdbApiKey();
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not set on the server' });
    }

    const { id } = req.params;
    const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    
    res.json(response.data);
  } catch (error) {
    console.error(`TMDB movie details error for movie ${id}:`, error);
    res.status(500).json({ error: 'Failed to get movie details' });
  }
});

// Get TV show details
router.get('/tv/:id', async (req, res) => {
  try {
    const TMDB_API_KEY = getTmdbApiKey();
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not set on the server' });
    }

    const { id } = req.params;
    const url = `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    
    res.json(response.data);
  } catch (error) {
    console.error(`TMDB TV show details error for show ${id}:`, error);
    res.status(500).json({ error: 'Failed to get TV show details' });
  }
});

// Helper function to map TMDB person to Celebrity format
function mapTmdbToCelebrity(person, includeDetails = false) {
  const professions = getProfessionsFromKnownFor(person.known_for || person.known_for_department);
  
  return {
    id: `tmdb_${person.id}`,
    name: person.name,
    profession: professions.length > 0 ? professions : [person.known_for_department || 'Actor'],
    imageUrl: person.profile_path ? `${IMAGE_BASE_URL}${person.profile_path}` : '/assets/images/placeholder.jpg',
    description: includeDetails ? person.biography : undefined,
    popularity: person.popularity,
    source: 'tmdb'
  };
}

function getProfessionsFromKnownFor(knownFor) {
  const professions = new Set();
  
  if (Array.isArray(knownFor)) {
    knownFor.forEach((item) => {
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

export { router as tmdbRoutes };
