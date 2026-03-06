import express from 'express';
import axios from 'axios';

const router = express.Router();
const BASE_URL = 'https://en.wikipedia.org/api/rest_v1';
const SEARCH_URL = 'https://en.wikipedia.org/w/api.php';

// Search celebrities
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const searchUrl = `${SEARCH_URL}?action=opensearch&search=${encodeURIComponent(query)}&limit=10&namespace=0&format=json&origin=*`;
    const response = await axios.get(searchUrl);
    
    const titles = response.data[1] || [];
    const descriptions = response.data[2] || [];
    
    const celebrityResults = titles
      .map((title, index) => ({
        title,
        description: descriptions[index] || ''
      }))
      .filter((item) => isCelebrityDescription(item.description || item.title));

    const celebrities = celebrityResults.slice(0, 5).map((result) => ({
      id: `wiki_${result.title.replace(/\s/g, '_')}`,
      name: result.title,
      profession: extractProfession(result.description),
      imageUrl: '/assets/images/placeholder.jpg',
      description: result.description,
      source: 'wikipedia'
    }));
    
    res.json(celebrities);
  } catch (error) {
    console.error('Wikipedia search error:', error);
    res.status(500).json({ error: 'Failed to search celebrities' });
  }
});

// Get celebrity details
router.get('/person/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const decodedTitle = decodeURIComponent(title);
    const url = `${BASE_URL}/page/summary/${encodeURIComponent(decodedTitle)}`;
    
    const response = await axios.get(url);
    
    if (response.data.type === 'standard') {
      const celebrity = mapWikipediaToCelebrity(response.data);
      res.json(celebrity);
    } else {
      res.status(404).json({ error: 'Page not found' });
    }
  } catch (error) {
    console.error(`Wikipedia details error for ${req.params.title}:`, error);
    const decodedTitle = decodeURIComponent(req.params.title);
    res.json({
      id: `wiki_${decodedTitle.replace(/\s/g, '_')}`,
      name: decodedTitle,
      profession: ['Celebrity'],
      imageUrl: '/assets/images/placeholder.jpg',
      source: 'wikipedia'
    });
  }
});

// Find connection between two celebrities
router.get('/connection', async (req, res) => {
  try {
    const { startName, endName } = req.query;
    
    if (!startName || !endName) {
      return res.status(400).json({ error: 'startName and endName parameters are required' });
    }

    console.log(`Wikipedia connection search from ${startName} to ${endName}`);
    
    // Get links from both celebrities' pages
    const [startLinks, endLinks] = await Promise.all([
      getPageLinks(startName),
      getPageLinks(endName)
    ]);
    
    // Check for direct connection (1 degree)
    if (startLinks.includes(endName)) {
      console.log('Found direct connection (1 degree)');
      return res.json([startName, endName]);
    }
    
    if (endLinks.includes(startName)) {
      console.log('Found direct connection (1 degree)');
      return res.json([startName, endName]);
    }
    
    // Check for 2-degree connection (mutual link)
    const mutualLinks = startLinks.filter(link => endLinks.includes(link));
    if (mutualLinks.length > 0) {
      // Find the first mutual link that looks like a person
      const personLink = mutualLinks.find(link => isLikelyPersonName(link));
      if (personLink) {
        console.log('Found 2-degree connection via', personLink);
        return res.json([startName, personLink, endName]);
      }
    }
    
    // No connection found within 2 degrees
    console.log('No Wikipedia connection found within 2 degrees');
    res.json([]);
  } catch (error) {
    console.error('Wikipedia connection search error:', error);
    res.status(500).json({ error: 'Failed to find connection' });
  }
});

// Helper function to get page links
async function getPageLinks(pageName) {
  try {
    const url = `${SEARCH_URL}?action=query&titles=${encodeURIComponent(pageName)}&prop=links&pllimit=100&format=json&origin=*`;
    const response = await axios.get(url);
    
    const pages = response.data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (pageId === '-1') {
      return [];
    }
    
    const links = pages[pageId]?.links || [];
    return links
      .map((link) => link.title)
      .filter((title) => isLikelyPersonName(title));
  } catch (error) {
    console.error(`Error getting links for ${pageName}:`, error);
    return [];
  }
}

// Helper function to check if title is likely a person's name
function isLikelyPersonName(title) {
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

// Helper function to check if description indicates a celebrity
function isCelebrityDescription(text) {
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

// Helper function to extract profession from description
function extractProfession(description) {
  const professions = [];
  const lowerDesc = description.toLowerCase();

  const professionMap = {
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

// Helper function to map Wikipedia page to Celebrity format
function mapWikipediaToCelebrity(page) {
  return {
    id: `wiki_${page.pageid || page.title.replace(/\s/g, '_')}`,
    name: page.title,
    profession: extractProfession(page.description || page.extract || ''),
    imageUrl: page.thumbnail?.source || page.originalimage?.source || '/assets/images/placeholder.jpg',
    description: page.extract,
    source: 'wikipedia'
  };
}

export { router as wikipediaRoutes };
