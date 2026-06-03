'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { ArrowLeft, Sparkles, Edit3, ChevronRight, Home, Ruler, Check } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Link */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>

        {/* Project Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {project.location} &middot; {project.year}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {project.location}
          </Badge>
        </div>

        {/* Floor Plan Preview */}
        <Card className="mb-8 overflow-hidden">
          <div className="aspect-[16/9] sm:aspect-[16/10] bg-gradient-to-br from-slate-50 to-slate-100 relative flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-teal-600" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-4">Floor Plan Preview</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
                {model.rooms.slice(0, 4).map((room) => (
                  <Badge key={room} variant="outline" className="bg-white/90 text-xs">
                    {room}
                  </Badge>
                ))}
                {model.rooms.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{model.rooms.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Available Models */}
        <h2 className="font-semibold mb-4 text-lg">Available Models</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {MOCK_MODELS.map((m) => {
            const isSelected = selectedModel === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className="text-left w-full"
              >
                <Card
                  className={`relative transition-all duration-200 ${
                    isSelected
                      ? 'border-teal-500 ring-2 ring-teal-200 shadow-lg'
                      : 'border-slate-200 hover:border-teal-300 hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-5">
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{m.name}</h3>
                        <Badge variant={isSelected ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                          {m.flatType}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {m.totalArea} sqm
                      </span>
                      <span className="flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {m.bedrooms} beds
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.rooms.slice(0, 3).map((room) => (
                        <Badge key={room} variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50">
                          {room}
                        </Badge>
                      ))}
                      {m.rooms.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{m.rooms.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all"
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
