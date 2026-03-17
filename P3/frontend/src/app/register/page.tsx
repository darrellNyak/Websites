'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      Cookies.set('token', response.data.token);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Join Screend</h1>
        <form onSubmit={handleSubmit} className="bg-dark-surface p-8 rounded-lg border border-dark-border">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              minLength={3}
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded text-white focus:outline-none focus:border-white"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded text-white focus:outline-none focus:border-white"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded text-white focus:outline-none focus:border-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-dark-bg rounded font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          <p className="mt-4 text-center text-sm text-dark-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
