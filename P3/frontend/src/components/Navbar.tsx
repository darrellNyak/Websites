'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      if (token) {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      }
    } catch (error) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      Cookies.remove('token');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-dark-surface border-b border-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-white">
              Screend
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="text-dark-text-muted hover:text-white">
                Home
              </Link>
              <Link href="/discover" className="text-dark-text-muted hover:text-white">
                Discover
              </Link>
              {user && (
                <>
                  <Link href="/feed" className="text-dark-text-muted hover:text-white">
                    Feed
                  </Link>
                  <Link href="/watchlist" className="text-dark-text-muted hover:text-white">
                    Watchlist
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 border-2 border-dark-border border-t-white rounded-full animate-spin" />
            ) : user ? (
              <>
                <Link
                  href={`/users/${user.username}`}
                  className="text-dark-text-muted hover:text-white"
                >
                  {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-dark-card hover:bg-dark-border rounded text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-dark-text-muted hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-white text-dark-bg rounded text-sm font-medium hover:bg-gray-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
