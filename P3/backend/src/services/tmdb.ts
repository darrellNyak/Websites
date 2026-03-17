import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

class TMDBService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  TMDB_API_KEY not set');
    }
  }

  private async request(endpoint: string, params: Record<string, any> = {}) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
        params: {
          api_key: this.apiKey,
          ...params,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('TMDB API error:', error.response?.data || error.message);
      throw error;
    }
  }

  imageUrl(path: string, size: string = 'w500') {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }

  async searchShows(query: string, page: number = 1) {
    return this.request('/search/tv', { query, page });
  }

  async getShowDetails(tmdbId: number) {
    return this.request(`/tv/${tmdbId}`);
  }

  async getShowSeasons(tmdbId: number) {
    const show = await this.getShowDetails(tmdbId);
    return show.seasons || [];
  }

  async getSeasonDetails(tmdbId: number, seasonNumber: number) {
    return this.request(`/tv/${tmdbId}/season/${seasonNumber}`);
  }

  async getTrendingShows(timeWindow: 'day' | 'week' = 'week') {
    return this.request(`/trending/tv/${timeWindow}`);
  }

  async getPopularShows(page: number = 1) {
    return this.request('/tv/popular', { page });
  }

  async getTopRatedShows(page: number = 1) {
    return this.request('/tv/top_rated', { page });
  }
}

export default new TMDBService();
