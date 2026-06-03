'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, FolderOpen } from 'lucide-react';

function timeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}

type ProjectStatus = 'renders-ready' | 'sample-ready' | 'in-progress';

interface Project {
  id: string;
  name: string;
  flatModel: string;
  btoProject: string;
  status: ProjectStatus;
  style: string;
  renderCount: number;
  updatedAt: Date;
  progress?: number;
  thumbnailPlaceholders: number;
}

const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'My Verandah Kallang 4-Room',
    flatModel: '4-Room Model A',
    btoProject: 'Verandah Kallang 2024',
    status: 'renders-ready',
    style: 'Japandi + Vintage',
    renderCount: 6,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    thumbnailPlaceholders: 4,
  },
  {
    id: 'proj-2',
    name: 'Queenstown Scandi',
    flatModel: '5-Room Model B',
    btoProject: 'Queenstown Project 2024',
    status: 'sample-ready',
    style: 'Scandinavian',
    renderCount: 1,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    thumbnailPlaceholders: 1,
  },
  {
    id: 'proj-3',
    name: 'Tampines Greenwalk',
    flatModel: '4-Room',
    btoProject: 'Tampines Greenwalk 2025',
    status: 'in-progress',
    style: 'Styled 3 of 4 rooms',
    renderCount: 0,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last week
    progress: 60,
    thumbnailPlaceholders: 0,
  },
];

const STATUS_CONFIG: Record<ProjectStatus, { label: string; badgeClass: string; indicatorClass: string }> = {
  'renders-ready': {
    label: 'Renders Ready',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    indicatorClass: 'bg-green-500',
  },
  'sample-ready': {
    label: 'Sample Ready',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200',
    indicatorClass: 'bg-teal-500',
  },
  'in-progress': {
    label: 'In Progress',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    indicatorClass: 'bg-slate-400',
  },
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium ${config.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.indicatorClass}`} />
      {config.label}
    </span>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const isInProgress = project.status === 'in-progress';

  return (
    <div
      onClick={() => router.push(`/studio/${project.id}`)}
      className={`bg-white rounded-xl border border-slate-200 p-5 transition cursor-pointer ${
        isInProgress ? 'opacity-60' : 'hover:border-teal-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{project.name}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {project.btoProject} · {project.flatModel}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Details row */}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
        {project.style && <span>🎨 {project.style}</span>}
        {project.renderCount > 0 && <span>🖼️ {project.renderCount} render{project.renderCount > 1 ? 's' : ''}</span>}
        {project.renderCount === 0 && project.status === 'in-progress' && <span>Furniture pending</span>}
        <span>Updated {timeAgo(project.updatedAt)}</span>
      </div>

      {/* Thumbnail previews */}
      {project.thumbnailPlaceholders > 0 && (
        <div className="flex gap-2 mt-3">
          {Array.from({ length: Math.min(project.thumbnailPlaceholders, 3) }).map((_, i) => (
            <div key={i} className="w-12 h-8 bg-slate-100 rounded" />
          ))}
          {project.thumbnailPlaceholders > 3 && (
            <span className="text-xs text-slate-400 self-center ml-1">
              +{project.thumbnailPlaceholders - 3} more
            </span>
          )}
          {project.thumbnailPlaceholders === 1 && (
            <span className="text-xs text-slate-400 self-center ml-1">Sample only</span>
          )}
        </div>
      )}

      {/* Progress bar for unfinished projects */}
      {isInProgress && project.progress !== undefined && (
        <div className="mt-3">
          <Progress value={project.progress} className="h-1.5 bg-slate-100" />
          <div className="text-xs text-slate-400 mt-1">{project.progress}% complete</div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">
        <FolderOpen className="w-16 h-16 mx-auto text-slate-300" />
      </div>
      <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
      <p className="text-sm text-slate-500 mb-6">
        Select a BTO project and start designing your dream home.
      </p>
      <Link href="/browse">
        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
          Browse BTO Projects
        </Button>
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const projects = MOCK_PROJECTS;
  const hasProjects = projects.length > 0;

  // Compute summary text
  const lastUpdated = hasProjects
    ? projects.reduce((latest, p) => (p.updatedAt > latest ? p.updatedAt : latest), projects[0].updatedAt)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Projects</h1>
            {hasProjects && lastUpdated && (
              <p className="text-sm text-slate-500 mt-1">
                {projects.length} project{projects.length > 1 ? 's' : ''} — last updated{' '}
                {timeAgo(lastUpdated)}
              </p>
            )}
          </div>
          <Link href="/browse">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Project list */}
        {hasProjects ? (
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
