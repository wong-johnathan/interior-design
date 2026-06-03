'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Building2, MapPin, Calendar, Layers, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const MOCK_PROJECTS = [
  { id: '1', name: 'Verandah Kallang 2024', slug: 'verandah-kallang-2024', location: 'Kallang', year: 2024, models: 4, status: 'published' as const },
  { id: '2', name: 'Queenstown Project 2024', slug: 'queenstown-project-2024', location: 'Queenstown', year: 2024, models: 3, status: 'published' as const },
  { id: '3', name: 'Clementi Ridges 2025', slug: 'clementi-ridges-2025', location: 'Clementi', year: 2025, models: 1, status: 'coming-soon' as const },
  { id: '4', name: 'Tampines Greenwalk 2025', slug: 'tampines-greenwalk-2025', location: 'Tampines', year: 2025, models: 3, status: 'draft' as const },
  { id: '5', name: 'Bukit Batok Hillside 2025', slug: 'bukit-batok-hillside-2025', location: 'Bukit Batok', year: 2025, models: 2, status: 'draft' as const },
  { id: '6', name: 'Woodlands North Shore', slug: 'woodlands-north-shore-2024', location: 'Woodlands', year: 2024, models: 5, status: 'published' as const },
  { id: '7', name: 'Bedok South Horizon', slug: 'bedok-south-horizon-2025', location: 'Bedok', year: 2025, models: 3, status: 'coming-soon' as const },
  { id: '8', name: 'Jurong Lake District', slug: 'jurong-lake-district-2026', location: 'Jurong', year: 2026, models: 0, status: 'draft' as const },
];

const STATUS_STYLES: Record<string, string> = {
  'published': 'bg-green-100 text-green-700 border-green-200',
  'draft': 'bg-slate-100 text-slate-600 border-slate-200',
  'coming-soon': 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function AdminProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = MOCK_PROJECTS.filter((p) => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">BTO Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all BTO projects, flat models, and floor plans</p>
        </div>
        <Link href="/admin/projects/new">
          <Button className="bg-amber-600 hover:bg-amber-500 text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Project
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects by name, location or slug..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="coming-soon">Coming Soon</option>
            </select>
            <div className="text-xs text-slate-400 font-medium ml-auto">
              {filtered.length} of {MOCK_PROJECTS.length} projects
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Year</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Models</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{project.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{project.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {project.location}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {project.year}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span className={project.models === 0 ? 'text-slate-400' : 'text-slate-700'}>
                          {project.models}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLES[project.status]}`}>
                        {project.status === 'coming-soon' ? 'Coming Soon' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5 px-2 py-1 rounded hover:bg-amber-50 transition-colors">
                          Edit <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <button className="text-xs text-slate-400 hover:text-red-500 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No projects found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
