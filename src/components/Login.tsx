import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup' | 'magic';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setInfo('Check your email for a magic link to sign in.');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Account created! Check your email to confirm, or sign in if confirmation is disabled.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-5 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-black">C</span>
            </div>
            <span className="text-sm font-bold text-slate-800">Castle Companies Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'signup' ? 'Create account' : mode === 'magic' ? 'Sign in with email' : 'Welcome back'}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            {mode === 'signup'
              ? 'Set up your property management account.'
              : mode === 'magic'
              ? "We'll send you a magic link — no password needed."
              : 'Sign in to your property services portal.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@castlecompanies.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {mode !== 'magic' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
            )}
            {info && (
              <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2.5">{info}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading
                ? 'Please wait…'
                : mode === 'signup'
                ? 'Create account'
                : mode === 'magic'
                ? 'Send magic link'
                : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 space-y-2 pt-4 border-t border-slate-100">
            {mode !== 'login' && (
              <button
                onClick={() => { setMode('login'); setError(''); setInfo(''); }}
                className="w-full text-sm text-slate-500 hover:text-slate-700 transition py-1"
              >
                Sign in with password
              </button>
            )}
            {mode !== 'signup' && (
              <button
                onClick={() => { setMode('signup'); setError(''); setInfo(''); }}
                className="w-full text-sm text-slate-500 hover:text-slate-700 transition py-1"
              >
                Create an account
              </button>
            )}
            {mode !== 'magic' && (
              <button
                onClick={() => { setMode('magic'); setError(''); setInfo(''); }}
                className="w-full text-sm text-slate-500 hover:text-slate-700 transition py-1"
              >
                Sign in with magic link
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Powered by HaulinBuddy · Castle Companies
        </p>
      </div>
    </div>
  );
}
