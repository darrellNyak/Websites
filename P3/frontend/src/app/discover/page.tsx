'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

export default function DiscoverPage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const trendingRes = await api.get('/shows/trending');
      setTrending(trendingRes.data.results);
      setLoading(false);
    } catch (error) {
      console.error('Error loading trending:', error);
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await api.get(`/shows/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const showsToDisplay = searchResults.length > 0 ? searchResults : trending;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Discover Shows</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for shows..."
            className="flex-1 px-4 py-2 bg-dark-card border border-dark-border rounded text-white focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-white text-dark-bg rounded font-medium hover:bg-gray-200"
          >
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-dark-border border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {searchResults.length > 0 ? 'Search Results' : 'Trending Shows'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {showsToDisplay.map((show) => (
              <Link
                key={show.tmdb_id}
                href={`/shows/${show.tmdb_id}`}
                className="group"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-dark-card mb-2">
                  {show.poster_url ? (
                    <Image
                      src={show.poster_url}
                      alt={show.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-text-muted">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium truncate group-hover:text-white">
                  {show.title}
                </h3>
                {show.average_rating && (
                  <p className="text-xs text-dark-text-muted">
                    ⭐ {show.average_rating.toFixed(1)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
