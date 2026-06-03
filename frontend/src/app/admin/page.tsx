'use client';

import {
  Building2,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  UserPlus,
  Home,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATS = [
  { icon: Building2, label: 'Total BTOs', value: '24', change: '+3 this month', color: 'text-amber-600' },
  { icon: Users, label: 'Total Users', value: '1,482', change: '+89 new', color: 'text-blue-600' },
  { icon: Activity, label: 'Active Projects', value: '12', change: '8 published', color: 'text-green-600' },
  { icon: Clock, label: 'Pending Waitlist', value: '47', change: '12 urgent', color: 'text-red-600' },
];

const RECENT_PROJECTS = [
  { name: 'Verandah Kallang 2024', location: 'Kallang', models: 4, status: 'published' as const },
  { name: 'Queenstown Project 2024', location: 'Queenstown', models: 3, status: 'published' as const },
  { name: 'Tampines Greenwalk 2025', location: 'Tampines', models: 3, status: 'draft' as const },
  { name: 'Clementi Ridges 2025', location: 'Clementi', models: 1, status: 'coming-soon' as const },
  { name: 'Bukit Batok Hillside 2025', location: 'Bukit Batok', models: 2, status: 'draft' as const },
];

const RECENT_USERS = [
  { name: 'Sarah Lim', email: 'sarah.lim@example.com', projects: 3, joined: '2 days ago' },
  { name: 'James Tan', email: 'james.tan@example.com', projects: 1, joined: '5 days ago' },
  { name: 'Priya Patel', email: 'priya.p@example.com', projects: 7, joined: '1 week ago' },
  { name: 'David Chen', email: 'david.chen@example.com', projects: 2, joined: '1 week ago' },
  { name: 'Nurul Huda', email: 'nurul.h@example.com', projects: 4, joined: '2 weeks ago' },
];

const WAITLIST_ALERTS = [
  { project: 'Tampines Greenwalk 2025', name: '4-Room Model A', count: 18, days: 3 },
  { project: 'Clementi Ridges 2025', name: '4-Room Model A', count: 12, days: 7 },
  { project: 'Verandah Kallang 2024', name: '5-Room Model A', count: 9, days: 1 },
];

const STATUS_COLORS: Record<string, string> = {
  'published': 'bg-green-100 text-green-700 border-green-200',
  'draft': 'bg-slate-100 text-slate-600 border-slate-200',
  'coming-soon': 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your BTO platform</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Waitlist alerts */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Waitlist Alerts</h3>
            <Badge className="bg-amber-600 text-white border-0 ml-auto">
              {WAITLIST_ALERTS.length} alerts
            </Badge>
          </div>
          <div className="space-y-2">
            {WAITLIST_ALERTS.map((alert) => (
              <div
                key={`${alert.project}-${alert.name}`}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-200 text-sm"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="font-medium text-slate-800">{alert.project}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="text-slate-600">{alert.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-red-600 font-semibold">{alert.count} waiting</span>
                  <span className="text-slate-400">{alert.days}d old</span>
                  <button className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5">
                    Review <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two column: Recent Projects + Recent Users */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent BTO Projects */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700 flex items-center justify-between">
              <span>Recent BTO Projects</span>
              <span className="text-xs text-slate-400 font-normal">{RECENT_PROJECTS.length} total</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {RECENT_PROJECTS.map((project) => (
                <div key={project.name} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{project.name}</div>
                    <div className="text-xs text-slate-400">{project.location} · {project.models} models</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[project.status]}`}>
                    {project.status === 'coming-soon' ? 'Coming Soon' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700 flex items-center justify-between">
              <span>Recent Users</span>
              <span className="text-xs text-slate-400 font-normal">
                <UserPlus className="w-3 h-3 inline mr-0.5" />
                {RECENT_USERS.length} new
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {RECENT_USERS.map((user) => (
                <div key={user.email} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-medium">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">{user.name}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-slate-500">{user.projects} projects</div>
                    <div className="text-slate-400">{user.joined}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
