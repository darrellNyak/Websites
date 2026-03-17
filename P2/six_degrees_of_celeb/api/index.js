const express = require('express');

const app = express();

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vercel API is running' });
});

// ---- TMDB helpers ----
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

function getTmdbKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  return key;
}

async function tmdbFetch(path, req, res) {
  const key = getTmdbKey();
  if (!key) {
    return res.status(500).json({ error: 'TMDB_API_KEY is not set on server' });
  }

  const url = `${TMDB_BASE_URL}${path}${path.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(
    key
  )}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json(data);
    }
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to contact TMDB' });
  }
}

function getProfessionsFromKnownFor(knownFor) {
  const professions = new Set();

  if (Array.isArray(knownFor)) {
    knownFor.forEach((item) => {
      if (item.media_type === 'movie') professions.add('Actor');
      else if (item.media_type === 'tv') professions.add('TV Actor');
    });
  } else if (typeof knownFor === 'string') {
    professions.add(knownFor);
  }

  return Array.from(professions);
}

function mapTmdbToCelebrity(person, includeDetails = false) {
  const professions = getProfessionsFromKnownFor(person.known_for || person.known_for_department);

  return {
    id: `tmdb_${person.id}`,
    name: person.name,
    profession: professions.length > 0 ? professions : [person.known_for_department || 'Actor'],
    imageUrl: person.profile_path
      ? `${IMAGE_BASE_URL}${person.profile_path}`
      : '/assets/images/placeholder.jpg',
    description: includeDetails ? person.biography : undefined,
    popularity: person.popularity,
    source: 'tmdb',
  };
}

// TMDB: search
app.get('/api/tmdb/search', async (req, res) => {
  const { query, page = '1' } = req.query;
  if (!query) return res.status(400).json({ error: 'query is required' });

  const key = getTmdbKey();
  if (!key) return res.status(500).json({ error: 'TMDB_API_KEY is not set on server' });

  const url = `${TMDB_BASE_URL}/search/person?api_key=${encodeURIComponent(
    key
  )}&query=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    return res.json({
      celebrities: (data.results || []).map((p) => mapTmdbToCelebrity(p)),
      total: data.total_results || 0,
      page: Number(page) || 1,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to search TMDB' });
  }
});

// TMDB: popular
app.get('/api/tmdb/popular', async (req, res) => {
  const key = getTmdbKey();
  if (!key) return res.status(500).json({ error: 'TMDB_API_KEY is not set on server' });

  const url = `${TMDB_BASE_URL}/person/popular?api_key=${encodeURIComponent(key)}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.json((data.results || []).map((p) => mapTmdbToCelebrity(p)));
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load popular celebrities' });
  }
});

// TMDB: person details
app.get('/api/tmdb/person/:id', async (req, res) => {
  const { id } = req.params;
  const key = getTmdbKey();
  if (!key) return res.status(500).json({ error: 'TMDB_API_KEY is not set on server' });

  const url = `${TMDB_BASE_URL}/person/${encodeURIComponent(id)}?api_key=${encodeURIComponent(key)}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.json(mapTmdbToCelebrity(data, true));
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load person details' });
  }
});

// TMDB: movie credits for a person (combined_credits filtered to movie)
app.get('/api/tmdb/person/:id/credits', async (req, res) => {
  const { id } = req.params;
  const key = getTmdbKey();
  if (!key) return res.status(500).json({ error: 'TMDB_API_KEY is not set on server' });

  const url = `${TMDB_BASE_URL}/person/${encodeURIComponent(
    id
  )}/combined_credits?api_key=${encodeURIComponent(key)}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.json({
      cast: (data.cast || [])
        .filter((c) => c.media_type === 'movie')
        .map((c) => ({ ...c, mediaType: 'movie' })),
      crew: (data.crew || []).map((c) => ({ ...c, mediaType: c.media_type })),
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load credits' });
  }
});

// TMDB: tv credits for a person (combined_credits filtered to tv)
app.get('/api/tmdb/person/:id/tv-credits', async (req, res) => {
  const { id } = req.params;
  const key = getTmdbKey();
  if (!key) return res.status(500).json({ error: 'TMDB_API_KEY is not set on server' });

  const url = `${TMDB_BASE_URL}/person/${encodeURIComponent(
    id
  )}/combined_credits?api_key=${encodeURIComponent(key)}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.json({
      cast: (data.cast || [])
        .filter((c) => c.media_type === 'tv')
        .map((c) => ({ ...c, mediaType: 'tv' })),
      crew: (data.crew || [])
        .filter((c) => c.media_type === 'tv')
        .map((c) => ({ ...c, mediaType: 'tv' })),
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load TV credits' });
  }
});

// TMDB: movie credits
app.get('/api/tmdb/movie/:id/credits', async (req, res) => {
  return tmdbFetch(`/movie/${encodeURIComponent(req.params.id)}/credits`, req, res);
});

// TMDB: tv credits
app.get('/api/tmdb/tv/:id/credits', async (req, res) => {
  return tmdbFetch(`/tv/${encodeURIComponent(req.params.id)}/credits`, req, res);
});

// TMDB: movie details
app.get('/api/tmdb/movie/:id', async (req, res) => {
  return tmdbFetch(`/movie/${encodeURIComponent(req.params.id)}`, req, res);
});

// TMDB: tv details
app.get('/api/tmdb/tv/:id', async (req, res) => {
  return tmdbFetch(`/tv/${encodeURIComponent(req.params.id)}`, req, res);
});

// ---- Wikipedia helpers ----
const WIKI_REST_BASE = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

function isCelebrityDescription(text) {
  const lowerText = String(text || '').toLowerCase();
  const celebrityKeywords = [
    'actor',
    'actress',
    'singer',
    'musician',
    'director',
    'producer',
    'writer',
    'comedian',
    'model',
    'celebrity',
    'film',
    'movie',
    'television',
    'hollywood',
    'bollywood',
    'entertainer',
    'performer',
    'artist',
    'rapper',
    'songwriter',
    'composer',
    'dancer',
    'tv personality',
    'host',
    'presenter',
    'star',
  ];
  return celebrityKeywords.some((k) => lowerText.includes(k));
}

function extractProfession(description) {
  const professions = [];
  const lowerDesc = String(description || '').toLowerCase();
  const professionMap = {
    actor: 'Actor',
    actress: 'Actress',
    singer: 'Singer',
    musician: 'Musician',
    director: 'Director',
    producer: 'Producer',
    writer: 'Writer',
    comedian: 'Comedian',
    model: 'Model',
    rapper: 'Rapper',
    songwriter: 'Songwriter',
    composer: 'Composer',
    dancer: 'Dancer',
  };

  Object.entries(professionMap).forEach(([key, value]) => {
    if (lowerDesc.includes(key)) professions.push(value);
  });
  return professions.length > 0 ? professions : ['Celebrity'];
}

function isLikelyPersonName(title) {
  const excludePatterns = [
    'List of',
    'Category:',
    'File:',
    'Template:',
    'Help:',
    'Wikipedia:',
    'Portal:',
    'Draft:',
    'TimedText:',
    'Module:',
    'MediaWiki:',
    'Special:',
    'Talk:',
    'User:',
    'Book:',
  ];
  if (excludePatterns.some((p) => title.startsWith(p))) return false;

  const hasParentheses = /\([^)]+\)/.test(title);
  if (hasParentheses) {
    const parenthesesContent = title.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '';
    const personKeywords = [
      'actor',
      'actress',
      'singer',
      'musician',
      'director',
      'producer',
      'writer',
      'comedian',
      'model',
      'artist',
      'performer',
      'celebrity',
      'born',
      'died',
    ];
    if (personKeywords.some((k) => parenthesesContent.includes(k))) return true;
  }

  const words = title.split(' ').filter((w) => w.length > 0);
  const isCapitalized = /^[A-Z]/.test(title);
  return isCapitalized && words.length >= 2 && words.length <= 4;
}

async function getWikiPageLinks(pageName) {
  const url = `${WIKI_API}?action=query&titles=${encodeURIComponent(
    pageName
  )}&prop=links&pllimit=100&format=json&origin=*`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') return [];
    const links = pages[pageId]?.links || [];
    return links.map((l) => l.title).filter((t) => isLikelyPersonName(t));
  } catch (e) {
    return [];
  }
}

function mapWikipediaToCelebrity(page) {
  return {
    id: `wiki_${page.pageid || page.title.replace(/\s/g, '_')}`,
    name: page.title,
    profession: extractProfession(page.description || page.extract || ''),
    imageUrl: page.thumbnail?.source || page.originalimage?.source || '/assets/images/placeholder.jpg',
    description: page.extract,
    source: 'wikipedia',
  };
}

// Wikipedia: search
app.get('/api/wikipedia/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query is required' });

  const searchUrl = `${WIKI_API}?action=opensearch&search=${encodeURIComponent(
    query
  )}&limit=10&namespace=0&format=json&origin=*`;

  try {
    const r = await fetch(searchUrl);
    const data = await r.json();
    const titles = data[1] || [];
    const descriptions = data[2] || [];

    const celebrityResults = titles
      .map((title, index) => ({ title, description: descriptions[index] || '' }))
      .filter((item) => isCelebrityDescription(item.description || item.title))
      .slice(0, 5);

    const celebrities = celebrityResults.map((result) => ({
      id: `wiki_${result.title.replace(/\s/g, '_')}`,
      name: result.title,
      profession: extractProfession(result.description),
      imageUrl: '/assets/images/placeholder.jpg',
      description: result.description,
      source: 'wikipedia',
    }));

    return res.json(celebrities);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to search Wikipedia' });
  }
});

// Wikipedia: person summary
app.get('/api/wikipedia/person/:title', async (req, res) => {
  const title = decodeURIComponent(req.params.title);
  const url = `${WIKI_REST_BASE}/page/summary/${encodeURIComponent(title)}`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    if (data.type === 'standard') return res.json(mapWikipediaToCelebrity(data));
    return res.status(404).json({ error: 'Page not found' });
  } catch (e) {
    return res.json({
      id: `wiki_${title.replace(/\s/g, '_')}`,
      name: title,
      profession: ['Celebrity'],
      imageUrl: '/assets/images/placeholder.jpg',
      source: 'wikipedia',
    });
  }
});

// Wikipedia: connection (<=2 degrees, same as your original logic)
app.get('/api/wikipedia/connection', async (req, res) => {
  const { startName, endName } = req.query;
  if (!startName || !endName) {
    return res.status(400).json({ error: 'startName and endName are required' });
  }

  const [startLinks, endLinks] = await Promise.all([
    getWikiPageLinks(String(startName)),
    getWikiPageLinks(String(endName)),
  ]);

  if (startLinks.includes(String(endName)) || endLinks.includes(String(startName))) {
    return res.json([String(startName), String(endName)]);
  }

  const mutualLinks = startLinks.filter((l) => endLinks.includes(l));
  const personLink = mutualLinks.find((l) => isLikelyPersonName(l));
  if (personLink) {
    return res.json([String(startName), personLink, String(endName)]);
  }

  return res.json([]);
});

module.exports = app;

