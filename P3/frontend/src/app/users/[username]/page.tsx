'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    const token = Cookies.get('token');
    if (token) {
      api.get('/auth/me').then((res) => setUser(res.data.user));
    }
  }, [username]);

  const loadProfile = async () => {
    try {
      const response = await api.get(`/users/${username}`);
      setProfile(response.data);
      setFollowing(response.data.is_following);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      alert('Please login to follow users');
      return;
    }

    try {
      if (following) {
        await api.post(`/social/unfollow/${profile.user.id}`);
        setFollowing(false);
      } else {
        await api.post(`/social/follow/${profile.user.id}`);
        setFollowing(true);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-dark-border border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-dark-text-muted">User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-dark-surface p-8 rounded-lg border border-dark-border mb-8">
        <div className="flex items-start gap-6">
          {profile.user.avatar_url ? (
            <Image
              src={profile.user.avatar_url}
              alt={profile.user.username}
              width={100}
              height={100}
              className="rounded-full"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-dark-card flex items-center justify-center text-2xl">
              {profile.user.username[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{profile.user.username}</h1>
            {profile.user.bio && (
              <p className="text-dark-text-muted mb-4">{profile.user.bio}</p>
            )}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-dark-text-muted">Episodes Watched:</span>{' '}
                {profile.stats.episodes_watched}
              </div>
              <div>
                <span className="text-dark-text-muted">Shows Rated:</span>{' '}
                {profile.stats.shows_rated}
              </div>
              <div>
                <span className="text-dark-text-muted">Following:</span>{' '}
                {profile.stats.following_count}
              </div>
              <div>
                <span className="text-dark-text-muted">Followers:</span>{' '}
                {profile.stats.followers_count}
              </div>
            </div>
            {user && user.id !== profile.user.id && (
              <button
                onClick={handleFollow}
                className="mt-4 px-4 py-2 bg-white text-dark-bg rounded font-medium hover:bg-gray-200"
              >
                {following ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {profile.recent_activity.map((activity: any) => (
            <Link
              key={activity.id}
              href={`/shows/${activity.show_id}`}
              className="block bg-dark-surface p-4 rounded-lg border border-dark-border hover:border-white transition"
            >
              <div className="flex gap-4">
                {activity.show_poster && (
                  <div className="relative w-16 h-24 rounded overflow-hidden bg-dark-card flex-shrink-0">
                    <Image
                      src={activity.show_poster}
                      alt={activity.show_title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {activity.episode_title} • S{activity.season_number}E{activity.episode_number}
                  </p>
                  <p className="text-sm text-dark-text-muted">{activity.show_title}</p>
                  {activity.rating && (
                    <p className="text-yellow-400 mt-1">★{activity.rating}</p>
                  )}
                  {activity.review_text && (
                    <p className="text-dark-text-muted mt-2 text-sm">{activity.review_text}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
