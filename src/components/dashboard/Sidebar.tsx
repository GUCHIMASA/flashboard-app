
"use client";

import React from 'react';
import { 
  Rss, 
  Sparkles, 
  ShieldCheck, 
  LayoutDashboard, 
  Plus,
  Settings,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Category, FeedSource } from '@/app/lib/types';

interface DashboardSidebarProps {
  activeCategory: Category | 'All';
  setActiveCategory: (cat: Category | 'All') => void;
  sources: FeedSource[];
  onAddSource: () => void;
}

export function DashboardSidebar({ 
  activeCategory, 
  setActiveCategory, 
  sources,
  onAddSource
}: DashboardSidebarProps) {
  const categories: { label: Category | 'All'; icon: any }[] = [
    { label: 'All', icon: LayoutDashboard },
    { label: 'Reliable', icon: ShieldCheck },
    { label: 'Discovery', icon: Sparkles },
    { label: 'Custom', icon: Rss },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary p-2 rounded-lg">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-headline text-xl font-bold tracking-tight text-primary">AI Synapse</h1>
        </div>

        <nav className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                activeCategory === cat.label
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sources</h2>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddSource}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground group hover:text-foreground transition-colors cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
              <span className="flex-1 truncate">{source.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-sidebar-border mt-auto">
        <Button variant="outline" className="w-full justify-start gap-3 bg-background shadow-sm border-sidebar-border" size="sm">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </aside>
  );
}
