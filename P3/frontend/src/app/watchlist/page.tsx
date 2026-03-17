'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadWatchlist();
  }, [router]);

  const loadWatchlist = async () => {
    try {
      const response = await api.get('/watchlists');
      setWatchlist(response.data.watchlist);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (showId: number) => {
    try {
      await api.delete(`/watchlists/${showId}`);
      setWatchlist(watchlist.filter((item) => item.show_id !== showId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
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
      <h1 className="text-4xl font-bold mb-8">My Watchlist</h1>

      {watchlist.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-dark-text-muted mb-4">Your watchlist is empty.</p>
          <Link
            href="/discover"
            className="text-white hover:underline"
          >
            Discover shows to add
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {watchlist.map((item) => (
            <div key={item.id} className="group">
              <Link href={`/shows/${item.show_id}`}>
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-dark-card mb-2">
                  {item.poster_url ? (
                    <Image
                      src={item.poster_url}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-text-muted">
                      No Image
                    </div>
                  )}
                </div>
              </Link>
              <h3 className="text-sm font-medium truncate group-hover:text-white">
                {item.title}
              </h3>
              <button
                onClick={() => handleRemove(item.show_id)}
                className="text-xs text-red-400 hover:text-red-300 mt-1"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
