'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Building2, MapPin, Calendar, Layers, ArrowUpRight, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'hdb_admin_projects';

interface Project {
  id: string;
  name: string;
  slug: string;
  location: string;
  launchYear: string;
  status: 'draft' | 'published';
  createdAt: string;
  modelName?: string;
  modelCount?: number;
}

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Verandah Kallang 2024', slug: 'verandah-kallang-2024', location: 'Kallang', launchYear: '2024', status: 'published', createdAt: '2024-06-01', modelCount: 4 },
  { id: '2', name: 'Queenstown Project 2024', slug: 'queenstown-project-2024', location: 'Queenstown', launchYear: '2024', status: 'published', createdAt: '2024-05-15', modelCount: 3 },
  { id: '3', name: 'Clementi Ridges 2025', slug: 'clementi-ridges-2025', location: 'Clementi', launchYear: '2025', status: 'published', createdAt: '2025-01-10', modelCount: 1 },
  { id: '4', name: 'Tampines Greenwalk 2025', slug: 'tampines-greenwalk-2025', location: 'Tampines', launchYear: '2025', status: 'draft', createdAt: '2025-02-20', modelCount: 3 },
  { id: '5', name: 'Bukit Batok Hillside 2025', slug: 'bukit-batok-hillside-2025', location: 'Bukit Batok', launchYear: '2025', status: 'draft', createdAt: '2025-03-05', modelCount: 2 },
  { id: '6', name: 'Woodlands North Shore', slug: 'woodlands-north-shore-2024', location: 'Woodlands', launchYear: '2024', status: 'published', createdAt: '2024-08-12', modelCount: 5 },
  { id: '7', name: 'Bedok South Horizon', slug: 'bedok-south-horizon-2025', location: 'Bedok', launchYear: '2025', status: 'published', createdAt: '2025-04-01', modelCount: 3 },
  { id: '8', name: 'Jurong Lake District', slug: 'jurong-lake-district-2026', location: 'Jurong', launchYear: '2026', status: 'draft', createdAt: '2026-01-15', modelCount: 0 },
];

function loadSavedProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const saved: any[] = JSON.parse(raw);
    return saved.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      location: p.location || '',
      launchYear: p.launchYear || '',
      status: p.status || 'draft',
      createdAt: p.createdAt || new Date().toISOString(),
      modelName: p.modelName,
      modelCount: 1,
    }));
  } catch { return []; }
}

const STATUS_STYLES: Record<string, string> = {
  'published': 'bg-green-100 text-green-700 border-green-200',
  'draft': 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AdminProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    const saved = loadSavedProjects();
    setAllProjects([...MOCK_PROJECTS, ...saved]);
  }, []);

  const filtered = allProjects.filter((p) => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    const saved = loadSavedProjects();
    const filtered = saved.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    setAllProjects((prev) => prev.filter((p) => p.id !== id));
  };

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
            </select>
            <div className="text-xs text-slate-400 font-medium ml-auto">
              {filtered.length} of {allProjects.length} projects
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
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
                        {project.location || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {project.launchYear || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        STATUS_STYLES[project.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/projects/${project.id}`)}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                        >
                          Edit <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="text-xs text-slate-400 hover:text-red-500 font-medium flex items-center gap-0.5 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
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
              <p className="text-sm">No projects found. Click "Add New Project" to create one.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
