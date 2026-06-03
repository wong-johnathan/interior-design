'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Home, Sofa, Image as ImageIcon, Users, TrendingUp } from 'lucide-react';

export function AdminDashboard() {
  const stats = [
    { icon: Building2, label: 'BTO Projects', value: '12', color: 'text-blue-400' },
    { icon: Home, label: 'Flat Models', value: '34', color: 'text-green-400' },
    { icon: Sofa, label: 'Furniture Templates', value: '18', color: 'text-purple-400' },
    { icon: ImageIcon, label: 'Renders Generated', value: '247', color: 'text-teal-400' },
    { icon: Users, label: 'Active Users', value: '89', color: 'text-amber-400' },
    { icon: TrendingUp, label: 'Projects Created', value: '143', color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Manage BTO projects, flat models, and furniture templates</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-[10px] text-slate-400">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-200">Recent BTO Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['Verandah Kallang 2024', 'Queenstown Project 2024', 'Tampines Greenwalk 2025'].map(
              (project) => (
                <div
                  key={project}
                  className="flex items-center justify-between text-xs text-slate-400 py-1.5 border-b border-slate-700/50 last:border-0"
                >
                  <span>{project}</span>
                  <span className="text-teal-400">Edit →</span>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-200">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left text-xs text-slate-300 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg px-3 py-2 transition">
              ➕ Add New BTO Project
            </button>
            <button className="w-full text-left text-xs text-slate-300 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg px-3 py-2 transition">
              📐 Annotate Floor Plan
            </button>
            <button className="w-full text-left text-xs text-slate-300 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg px-3 py-2 transition">
              🛋️ Manage Furniture Templates
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
