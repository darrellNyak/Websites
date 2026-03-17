'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function ShowPage() {
  const params = useParams();
  const showId = params.id;
  const [show, setShow] = useState<any>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (showId) {
      loadShow();
    }
  }, [showId]);

  const loadShow = async () => {
    try {
      const token = Cookies.get('token');
      if (token) {
        const userRes = await api.get('/auth/me');
        setUser(userRes.data.user);
      }

      const showRes = await api.get(`/shows/${showId}`);
      setShow(showRes.data);
      setRating(showRes.data.user_rating);

      const seasonsRes = await api.get(`/shows/${showId}/seasons`);
      setSeasons(seasonsRes.data.seasons);
    } catch (error) {
      console.error('Error loading show:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateShow = async (newRating: number) => {
    if (!user) {
      alert('Please login to rate shows');
      return;
    }

    try {
      await api.post(`/ratings/shows/${show.id}`, { rating: newRating });
      setRating(newRating);
      loadShow(); // Reload to get updated average
    } catch (error) {
      console.error('Error rating show:', error);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!user) {
      alert('Please login to add to watchlist');
      return;
    }

    try {
      await api.post(`/watchlists/${show.id}`);
      alert('Added to watchlist!');
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert('Show already in watchlist');
      } else {
        console.error('Error adding to watchlist:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-dark-border border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-dark-text-muted">Show not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {show.backdrop_url && (
        <div className="relative h-96 w-full">
          <Image
            src={show.backdrop_url}
            alt={show.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <div className="relative w-48 h-72 rounded-lg overflow-hidden bg-dark-card shadow-2xl">
              {show.poster_url ? (
                <Image
                  src={show.poster_url}
                  alt={show.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-dark-text-muted">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">{show.title}</h1>
            {show.description && (
              <p className="text-dark-text-muted mb-6">{show.description}</p>
            )}

            <div className="flex flex-wrap gap-4 mb-6">
              {show.average_rating && (
                <div>
                  <span className="text-yellow-400">⭐</span>{' '}
                  {show.average_rating.toFixed(1)} ({show.rating_count} ratings)
                </div>
              )}
              {show.first_air_date && (
                <div className="text-dark-text-muted">
                  First aired: {new Date(show.first_air_date).getFullYear()}
                </div>
              )}
              {show.network && (
                <div className="text-dark-text-muted">Network: {show.network}</div>
              )}
            </div>

            {user && (
              <div className="flex gap-4 mb-6">
                <div>
                  <p className="text-sm mb-2">Your Rating:</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateShow(star)}
                        className={`text-2xl ${
                          rating && star <= rating
                            ? 'text-yellow-400'
                            : 'text-dark-text-muted'
                        } hover:text-yellow-400`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAddToWatchlist}
                  className="px-4 py-2 bg-dark-card hover:bg-dark-border rounded border border-dark-border"
                >
                  + Watchlist
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Seasons */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Seasons</h2>
          <div className="space-y-4">
            {seasons.map((season) => (
              <Link
                key={season.id}
                href={`/shows/${showId}/seasons/${season.season_number}`}
                className="block bg-dark-surface p-4 rounded-lg border border-dark-border hover:border-white transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">
                      {season.name || `Season ${season.season_number}`}
                    </h3>
                    <p className="text-sm text-dark-text-muted">
                      {season.episode_count} episodes
                      {user && season.watched_count > 0 && (
                        <span className="ml-2">
                          • {season.watched_count} watched
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-dark-text-muted">→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
