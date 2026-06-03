'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { ArrowLeft, Edit3, Sparkles, ChevronRight, Home, Ruler } from 'lucide-react';

const MOCK_MODELS = [
  {
    id: 'model-a-4r',
    name: '4-Room Model A',
    flatType: '4-room',
    totalArea: 90,
    bedrooms: 3,
    rooms: ['Living Room', 'Master Bedroom', 'Bedroom 2', 'Kitchen', 'Bathroom 1', 'Bathroom 2'],
    isSelected: true,
  },
  {
    id: 'model-b-4r',
    name: '4-Room Model B',
    flatType: '4-room',
    totalArea: 92,
    bedrooms: 3,
    rooms: ['Living Room', 'Master Bedroom', 'Bedroom 2', 'Kitchen', 'Bathroom 1', 'Bathroom 2'],
    isSelected: false,
  },
  {
    id: 'model-5r',
    name: '5-Room Premium',
    flatType: '5-room',
    totalArea: 110,
    bedrooms: 4,
    rooms: ['Living Room', 'Dining Room', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Kitchen', 'Bathroom 1', 'Bathroom 2'],
    isSelected: false,
  },
];

const PROJECT_MAP: Record<string, { name: string; location: string; year: number }> = {
  'verandah-kallang-2024': { name: 'Verandah Kallang', location: 'Kallang', year: 2024 },
  'queenstown-project-2024': { name: 'Queenstown Project', location: 'Queenstown', year: 2024 },
  'tampines-greenwalk-2025': { name: 'Tampines Greenwalk', location: 'Tampines', year: 2025 },
};

export default function FlatModelSelectorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const project = PROJECT_MAP[slug] || { name: slug, location: 'Unknown', year: 2024 };
  const [selectedModel, setSelectedModel] = useState(MOCK_MODELS[0].id);

  const model = MOCK_MODELS.find((m) => m.id === selectedModel) || MOCK_MODELS[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          href="/browse"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>

        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-slate-500">
            {project.location} · {project.year}
          </p>
        </div>

        {/* Floor Plan Preview */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
          <div className="aspect-[16/10] bg-slate-100 relative flex items-center justify-center">
            {/* Placeholder floor plan */}
            <div className="text-center">
              <div className="text-6xl mb-4">🏗️</div>
              <p className="text-sm text-slate-400 mb-2">Floor Plan Preview</p>
              <div className="flex flex-wrap gap-3 justify-center max-w-sm mx-auto">
                {model.rooms.slice(0, 4).map((room) => (
                  <span
                    key={room}
                    className="bg-white/80 text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600"
                  >
                    {room}
                  </span>
                ))}
                {model.rooms.length > 4 && (
                  <span className="text-xs text-slate-400 self-center">
                    +{model.rooms.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Available Models */}
        <h2 className="font-semibold mb-4 text-lg">Available Models</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {MOCK_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`text-left bg-white rounded-xl border p-5 transition ${
                selectedModel === m.id
                  ? 'border-teal-500 ring-2 ring-teal-200 shadow-md'
                  : 'border-slate-200 hover:border-teal-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{m.name}</h3>
                  <p className="text-xs text-slate-500">{m.flatType}</p>
                </div>
                {selectedModel === m.id && (
                  <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded font-medium">
                    Selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  {m.totalArea} sqm
                </span>
                <span className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  {m.bedrooms} beds
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => router.push(`/studio/new?modelId=${selectedModel}&useDefault=true`)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Designing
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push(`/edit/new?modelId=${selectedModel}`)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Layout First
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          &quot;Start Designing&quot; uses the default layout. &quot;Edit Layout First&quot; lets you modify walls and rooms.
        </p>
      </div>
    </div>
  );
}
