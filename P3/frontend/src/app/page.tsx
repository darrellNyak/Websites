'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function Home() {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = Cookies.get('token');
      if (token) {
        const userRes = await api.get('/auth/me');
        setUser(userRes.data.user);
      }

      const trendingRes = await api.get('/shows/trending');
      setTrending(trendingRes.data.results.slice(0, 12));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-dark-border border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Screend</h1>
        <p className="text-dark-text-muted text-lg">
          Track, rate, and review your favorite TV shows and episodes
        </p>
      </div>

      {user && (
        <div className="mb-8">
          <Link
            href="/feed"
            className="inline-block px-6 py-3 bg-white text-dark-bg rounded-lg font-medium hover:bg-gray-200 transition"
          >
            View Your Feed
          </Link>
        </div>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-6">Trending Shows</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trending.map((show) => (
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
      </section>
    </div>
  );
}
