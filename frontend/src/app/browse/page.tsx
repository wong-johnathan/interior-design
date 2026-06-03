'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Search, MapPin, Calendar, ChevronRight, AlertCircle } from 'lucide-react';

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

export default function BrowsePage() {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const filtered = MOCK_PROJECTS.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (yearFilter !== 'all' && p.launchYear !== Number(yearFilter)) return false;
    if (locationFilter !== 'all' && p.location !== locationFilter) return false;
    return true;
  });

  const locations = [...new Set(MOCK_PROJECTS.map((p) => p.location))];

  return (
    <div className="min-h-screen bg-slate-50">
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
        <p className="text-slate-500 mb-8">
          Select your project to see available floor plans and start designing.
        </p>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 max-w-md min-w-[240px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search BTO project name or location..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">All Years</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No projects found</h3>
            <p className="text-sm text-slate-500">
              No BTO projects match your search. Try a different location or check back soon.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((project) => (
              <Link
                key={project.id}
                href={project.status === 'available' ? `/browse/${project.slug}` : '#'}
                className={`bg-white rounded-xl border border-slate-200 p-5 transition ${
                  project.status === 'available'
                    ? 'hover:border-teal-400 hover:shadow-md cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {project.location}
                      <span className="mx-1">·</span>
                      <Calendar className="w-3 h-3" />
                      {project.launchYear}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      project.status === 'available'
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {project.status === 'available'
                      ? `${project.modelCount} models`
                      : 'Coming soon'}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {project.types.map((type) => (
                    <span
                      key={type}
                      className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">{project.description}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state (shown when no projects exist at all) */}
        {MOCK_PROJECTS.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏗️</div>
            <h2 className="text-lg font-semibold mb-2">Can&apos;t find your project?</h2>
            <p className="text-sm text-slate-500 mb-6">
              We&apos;re adding new BTOs regularly. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
