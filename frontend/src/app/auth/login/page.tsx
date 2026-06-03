'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏡</div>
          <h1 className="text-xl font-bold text-slate-900">HDB Design Studio</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to start designing</p>
        </div>

        <Button
          onClick={() => signIn('google', { callbackUrl: '/browse' })}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-6 hover:bg-slate-50 transition text-sm font-medium text-slate-700"
          variant="outline"
          size="lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </Button>

        <div className="mt-6 text-center text-xs text-slate-400">
          By signing in, you agree to our Terms and Privacy Policy.
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Admin access for project managers</p>
            <p className="text-[10px] text-slate-300">
              Sign in with an authorized admin email to access the admin panel
            </p>
          </div>
          <button
            onClick={() => signIn('google', { callbackUrl: '/admin' })}
            className="w-full text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-100 transition font-medium"
          >
            Sign in as Admin →
          </button>
        </div>
      </div>
    </div>
  );
}
