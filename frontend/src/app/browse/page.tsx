'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Search, ArrowLeft } from 'lucide-react';

const MOCK_PROJECTS = [
  {
    id: '1',
    name: 'Verandah Kallang',
    slug: 'verandah-kallang-2024',
    location: 'Kallang',
    launchYear: 2024,
    modelCount: 4,
    description: 'Premium project near Kallang Riverside Park. 3 flat types, 4 layouts.',
    types: ['4-Room', '5-Room', '3-Room'],
    status: 'available' as const,
  },
  {
    id: '2',
    name: 'Queenstown Project',
    slug: 'queenstown-project-2024',
    location: 'Queenstown',
    launchYear: 2024,
    modelCount: 3,
    description: 'Mature estate with excellent connectivity. 2 flat types, 3 layouts.',
    types: ['4-Room', '5-Room'],
    status: 'available' as const,
  },
  {
    id: '3',
    name: 'Clementi Ridges',
    slug: 'clementi-ridges-2025',
    location: 'Clementi',
    launchYear: 2025,
    modelCount: 1,
    description: 'BTO project launching 2025. Layouts being added.',
    types: ['4-Room'],
    status: 'coming-soon' as const,
  },
  {
    id: '4',
    name: 'Tampines Greenwalk',
    slug: 'tampines-greenwalk-2025',
    location: 'Tampines',
    launchYear: 2025,
    modelCount: 3,
    description: 'Green living at Tampines North. 3 flat types available.',
    types: ['4-Room', '5-Room', '3-Room'],
    status: 'available' as const,
  },
];

const MOCK_MODELS = [
  { id: 'model-a-4r', name: '4-Room Model A', flatType: '4-room', totalArea: 90, bedrooms: 3 },
  { id: 'model-b-4r', name: '4-Room Model B', flatType: '4-room', totalArea: 92, bedrooms: 3 },
  { id: 'model-5r', name: '5-Room Model A', flatType: '5-room', totalArea: 110, bedrooms: 4 },
];

export default function BrowsePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(MOCK_MODELS[0].id);

  const filtered = MOCK_PROJECTS.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (yearFilter !== 'all' && p.launchYear !== Number(yearFilter)) return false;
    if (locationFilter !== 'all' && p.location !== locationFilter) return false;
    return true;
  });

  const project = MOCK_PROJECTS.find((p) => p.id === selectedProject);
  const locations = [...new Set(MOCK_PROJECTS.map((p) => p.location))];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-slate-400 mb-6">
          <span className="text-teal-600 font-medium">BTO Projects</span>
          <span className="mx-1">›</span>
          <span className="text-slate-400">Select Model</span>
          <span className="mx-1">›</span>
          <span className="text-slate-300">Studio</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">Find your BTO project</h1>
        <p className="text-slate-500 mb-8">Select your project to see available floor plans and start designing.</p>

        {/* Search & Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search BTO project name or location..."
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">All Years</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Project Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const isAvailable = p.status === 'available';
            return (
              <div
                key={p.id}
                onClick={() => isAvailable && setSelectedProject(p.id)}
                className={`bg-white rounded-xl border p-5 transition ${
                  isAvailable
                    ? 'border-slate-200 hover:border-teal-400 hover:shadow-md cursor-pointer'
                    : 'border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{p.name}</h3>
                    <p className="text-sm text-slate-500">{p.location} · {p.launchYear}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    isAvailable
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isAvailable ? `${p.modelCount} models` : 'Coming soon'}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {p.types.map((type) => (
                    <span key={type} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">{type}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">{p.description}</p>
              </div>
            );
          })}
        </div>

        {/* Flat Model Selector (shown when a project is selected) */}
        {project && (
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedProject(null)}
                className="text-sm text-teal-600 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <h2 className="text-lg font-semibold">{project.name} {project.launchYear}</h2>
            </div>
            <div className="flex gap-4">
              {/* Floor plan thumbnail */}
              <div className="w-48 h-36 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm shrink-0">
                <div className="text-center">
                  <div className="text-2xl mb-1">📐</div>
                  Floor Plan
                </div>
              </div>
              {/* Model selection */}
              <div className="flex-1">
                <p className="text-sm text-slate-600 mb-3">Select your flat model to start designing:</p>
                <div className="grid grid-cols-3 gap-3">
                  {MOCK_MODELS.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`rounded-lg p-3 cursor-pointer border ${
                        selectedModel === m.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.totalArea} sqm · {m.bedrooms} bedrooms</div>
                      {selectedModel === m.id && (
                        <span className="text-[10px] text-teal-600 mt-1 block">Selected ✓</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => router.push(`/studio/new?modelId=${selectedModel}&useDefault=true`)}
                    className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                  >
                    Start Designing →
                  </button>
                  <button
                    onClick={() => router.push(`/edit/new?modelId=${selectedModel}`)}
                    className="flex-1 bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                  >
                    ✏️ Edit Layout First
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Start Designing uses the default layout. Edit Layout lets you knock down walls, merge rooms, or split rooms first.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
