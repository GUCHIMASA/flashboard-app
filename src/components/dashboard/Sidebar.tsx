"use client";

import React from 'react';
import { 
  Rss, 
  Sparkles, 
  ShieldCheck, 
  LayoutDashboard, 
  Plus,
  Settings,
  Zap,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Category, FeedSource } from '@/app/lib/types';
import { useAuth, useUser } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const auth = useAuth();
  const { user } = useUser();

  const handleLogin = () => {
    if (auth) {
      signInWithPopup(auth, new GoogleAuthProvider());
    }
  };

  const handleLogout = () => {
    if (auth) {
      signOut(auth);
    }
  };

  const categories: { label: Category | 'All'; labelJa: string; icon: any }[] = [
    { label: 'All', labelJa: 'すべて', icon: LayoutDashboard },
    { label: 'Reliable', labelJa: '信頼済み', icon: ShieldCheck },
    { label: 'Discovery', labelJa: '発見', icon: Sparkles },
    { label: 'Custom', labelJa: 'カスタム', icon: Rss },
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
              {cat.labelJa}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">購読ソース</h2>
          {user && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddSource}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="space-y-1">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground group hover:text-foreground transition-colors cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
              <span className="flex-1 truncate">{source.name}</span>
            </div>
          ))}
          {!user && (
            <p className="text-[10px] text-muted-foreground mt-2 px-3">
              ログインするとソースを追加できます
            </p>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border mt-auto bg-sidebar/50">
        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user.displayName?.[0] || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="bg-background text-[10px] h-8" onClick={handleLogout}>
                <LogOut className="w-3 h-3 mr-1" /> ログアウト
              </Button>
              <Button variant="ghost" size="sm" className="text-[10px] h-8">
                <Settings className="w-3 h-3 mr-1" /> 設定
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={handleLogin} className="w-full gap-2 text-xs font-bold" size="sm">
            <LogIn className="w-4 h-4" /> Googleでログイン
          </Button>
        )}
      </div>
    </aside>
  );
}
