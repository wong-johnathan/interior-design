'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, MessageSquare, Image as ImageIcon, Layers } from 'lucide-react';

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed');
    if (completed !== 'true') {
      router.replace('/onboarding');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 max-w-7xl mx-auto">
        <div className="text-xl font-bold text-teal-700 flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <span>HDB Design Studio</span>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/browse"
            className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline"
          >
            Browse BTOs
          </Link>
          {session?.user && (
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline"
            >
              My Projects
            </Link>
          )}
          {session?.user ? (
            <Link href="/dashboard">
              <Button variant="default" size="sm">
                Continue Designing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button variant="default" size="sm" onClick={() => signIn('google')}>
              Sign in with Google
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section - Split Layout */}
      <section className="grid md:grid-cols-2 min-h-[80vh] max-w-7xl mx-auto">
        {/* Left: Text */}
        <div className="flex flex-col justify-center px-6 md:px-16 py-12">
          <span className="text-teal-600 font-semibold text-sm tracking-wider uppercase mb-4">
            Singapore HDB Interior Design
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Design your dream<br />
            <span className="text-teal-600">BTO home</span> before<br />
            you get the keys.
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-md">
            Select your BTO project, chat with an AI design consultant, and generate
            photorealistic renders — all in your browser.
          </p>
          <div className="flex gap-3 mb-12 flex-wrap">
            {session?.user ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white">
                  Continue Designing <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => signIn('google')}
              >
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            <Link href="/browse">
              <Button variant="outline" size="lg">
                Browse BTOs
              </Button>
            </Link>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">✅ No download needed</span>
            <span className="flex items-center gap-1.5">✅ AI-powered</span>
            <span className="flex items-center gap-1.5">✅ SketchUp export</span>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-teal-50 to-slate-100">
          <div className="w-full max-w-md aspect-[4/3] bg-white rounded-2xl shadow-xl p-6 flex flex-col">
            <div className="flex gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
              <div className="text-center">
                <div className="text-5xl mb-3">🏠</div>
                <div className="text-xs">3D Model Preview</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="h-2 w-12 bg-teal-200 rounded" />
              <div className="h-2 w-8 bg-slate-200 rounded" />
              <div className="h-2 w-10 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: '📋', title: '1. Select BTO', desc: 'Choose your BTO project and flat layout' },
            { icon: '💬', title: '2. AI Design Chat', desc: 'Describe your style per room' },
            { icon: '🖼️', title: '3. Preview & Tweak', desc: 'Generate a sample render, iterate' },
            { icon: '📸', title: '4. Final Renders', desc: 'All rooms, multiple angles' },
          ].map((step) => (
            <div
              key={step.title}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center"
            >
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: MessageSquare, title: 'AI Design Consultant', desc: 'Describe your dream style naturally through conversation' },
            { icon: Layers, title: 'Edit Floor Plans', desc: 'Knock down walls or split rooms with our interactive editor' },
            { icon: ImageIcon, title: 'Photorealistic Renders', desc: 'AI-generated images of every room from your design brief' },
          ].map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        HDB Design Studio — Singapore
      </footer>
    </div>
  );
}
