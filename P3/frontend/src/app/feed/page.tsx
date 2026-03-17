'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function FeedPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadFeed();
  }, [router]);

  const loadFeed = async () => {
    try {
      const response = await api.get('/feed');
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Error loading feed:', error);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold mb-8">Your Feed</h1>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-dark-text-muted mb-4">
            Your feed is empty. Follow some users to see their activity!
          </p>
          <Link
            href="/discover"
            className="text-white hover:underline"
          >
            Discover users to follow
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-dark-surface p-6 rounded-lg border border-dark-border"
            >
              {activity.activity_type === 'episode_log' ? (
                <div>
                  <div className="flex items-start gap-4">
                    {activity.show_poster && (
                      <Link href={`/shows/${activity.show_id}`}>
                        <div className="relative w-16 h-24 rounded overflow-hidden bg-dark-card flex-shrink-0">
                          <Image
                            src={activity.show_poster}
                            alt={activity.show_title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>
                    )}
                    <div className="flex-1">
                      <p className="mb-2">
                        <Link
                          href={`/users/${activity.username}`}
                          className="font-medium hover:underline"
                        >
                          {activity.username}
                        </Link>{' '}
                        {activity.rating && (
                          <span className="text-yellow-400">
                            rated {activity.episode_title} ★{activity.rating}
                          </span>
                        )}
                        {!activity.rating && (
                          <span>watched {activity.episode_title}</span>
                        )}
                      </p>
                      <p className="text-sm text-dark-text-muted mb-2">
                        {activity.show_title} • S{activity.season_number}E{activity.episode_number}
                      </p>
                      {activity.review_text && (
                        <p className="text-dark-text-muted mt-2">{activity.review_text}</p>
                      )}
                      <p className="text-xs text-dark-text-muted mt-2">
                        {new Date(activity.watched_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  {activity.show_poster && (
                    <Link href={`/shows/${activity.show_id}`}>
                      <div className="relative w-16 h-24 rounded overflow-hidden bg-dark-card flex-shrink-0">
                        <Image
                          src={activity.show_poster}
                          alt={activity.show_title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                  )}
                  <div>
                    <p>
                      <Link
                        href={`/users/${activity.username}`}
                        className="font-medium hover:underline"
                      >
                        {activity.username}
                      </Link>{' '}
                      added <Link href={`/shows/${activity.show_id}`} className="hover:underline">
                        {activity.show_title}
                      </Link> to their watchlist
                    </p>
                    <p className="text-xs text-dark-text-muted mt-2">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
