'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Search, MapPin, Calendar, AlertCircle, Layers } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Find your BTO project</h1>
          <p className="text-slate-500">
            Select your project to see available floor plans and start designing.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 max-w-md min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search BTO project or location..."
              className="pl-9 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 border border-input rounded-lg px-3 text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">All Years</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <select
            className="h-10 border border-input rounded-lg px-3 text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((project) => {
              const isAvailable = project.status === 'available';
              return (
                <Link
                  key={project.id}
                  href={isAvailable ? `/browse/${project.slug}` : '#'}
                  className={!isAvailable ? 'pointer-events-none' : ''}
                >
                  <Card
                    className={`transition-all duration-200 h-full ${
                      isAvailable
                        ? 'hover:border-teal-400 hover:shadow-lg cursor-pointer'
                        : 'opacity-60'
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {project.location}
                            <span className="mx-1">&middot;</span>
                            <Calendar className="w-3 h-3" />
                            {project.launchYear}
                          </p>
                        </div>
                        <Badge variant={isAvailable ? 'default' : 'secondary'} className="shrink-0">
                          {isAvailable
                            ? `${project.modelCount} models`
                            : 'Coming soon'}
                        </Badge>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {project.types.map((type) => (
                          <Badge key={type} variant="outline" className="bg-slate-50 text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {project.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state (when no projects seeded) */}
        {MOCK_PROJECTS.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Can&apos;t find your project?</h2>
            <p className="text-sm text-slate-500 mb-6">
              We&apos;re adding new BTOs regularly. Check back soon!
            </p>
            <Button variant="outline" disabled>
              Join Waitlist
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
