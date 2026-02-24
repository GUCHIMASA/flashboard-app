
"use client";

import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  LayoutDashboard, 
  Plus,
  Settings,
  Zap,
  LogIn,
  LogOut,
  Bookmark,
  Globe,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category, FeedSource } from '@/app/lib/types';
import { useAuth, useUser } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  activeCategory: Category | 'All' | 'Bookmarks';
  selectedSourceName: string | null;
  onSelectSource: (source: FeedSource | 'All') => void;
  onDeleteSource?: (sourceId: string) => void;
  sources: FeedSource[];
  onAddSource: () => void;
}

export function DashboardSidebar({ 
  activeCategory, 
  selectedSourceName,
  onSelectSource, 
  onDeleteSource,
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

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  const reliableSources = sources.filter(s => s.category === 'Reliable');
  const discoverySources = sources.filter(s => s.category === 'Discovery');
  const customSources = sources.filter(s => s.category === 'Custom');

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-headline text-lg font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
            AI Synapse
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
            メインメニュー
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeCategory === 'All' && !selectedSourceName} 
                onClick={() => onSelectSource('All')}
                tooltip="タイムライン"
                className="h-10"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">タイムライン</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeCategory === 'Bookmarks'} 
                onClick={() => onSelectSource({ id: 'bookmarks', name: 'Bookmarks', url: '', category: 'Bookmarks' as any })}
                tooltip="ブックマーク"
                className="h-10"
              >
                <Bookmark className="w-5 h-5" />
                <span className="font-medium">ブックマーク</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 my-2 opacity-50" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 flex items-center justify-between">
            <span>一次ソース</span>
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reliableSources.map((source) => {
                const favicon = getFaviconUrl(source.url);
                return (
                  <SidebarMenuItem key={source.id}>
                    <SidebarMenuButton 
                      className="h-9 group"
                      isActive={selectedSourceName === source.name}
                      onClick={() => onSelectSource(source)}
                      tooltip={source.name}
                    >
                      <div className="w-5 h-5 rounded-md overflow-hidden bg-muted/50 mr-2 shrink-0 flex items-center justify-center border border-border/50">
                        {favicon ? (
                          <img src={favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                        ) : (
                          <Globe className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="truncate text-sm opacity-80 group-hover:opacity-100">{source.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 flex items-center justify-between">
            <span>発見ソース</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {discoverySources.map((source) => {
                const favicon = getFaviconUrl(source.url);
                return (
                  <SidebarMenuItem key={source.id}>
                    <SidebarMenuButton 
                      className="h-9 group"
                      isActive={selectedSourceName === source.name}
                      onClick={() => onSelectSource(source)}
                      tooltip={source.name}
                    >
                      <div className="w-5 h-5 rounded-md overflow-hidden bg-muted/50 mr-2 shrink-0 flex items-center justify-center border border-border/50">
                        {favicon ? (
                          <img src={favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                        ) : (
                          <Globe className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="truncate text-sm opacity-80 group-hover:opacity-100">{source.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 flex items-center justify-between">
            <span>マイソース</span>
            <div className="flex items-center gap-1">
              {user && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddSource(); }} 
                  className="hover:text-primary transition-colors p-1 bg-primary/10 rounded-md"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </button>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customSources.map((source) => {
                const favicon = getFaviconUrl(source.url);
                return (
                  <SidebarMenuItem key={source.id}>
                    <div className="flex items-center group/item px-2">
                      <SidebarMenuButton 
                        className="h-9 flex-1"
                        isActive={selectedSourceName === source.name}
                        onClick={() => onSelectSource(source)}
                        tooltip={source.name}
                      >
                        <div className="w-5 h-5 rounded-md overflow-hidden bg-muted/50 mr-2 shrink-0 flex items-center justify-center border border-border/50">
                          {favicon ? (
                            <img src={favicon} alt="" className="w-3.5 h-3.5 object-contain" />
                          ) : (
                            <Globe className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="truncate text-sm opacity-80 group-hover:opacity-100">{source.name}</span>
                      </SidebarMenuButton>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteSource) onDeleteSource(source.id);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all ml-1"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </SidebarMenuItem>
                );
              })}
              {user && customSources.length === 0 && (
                <p className="px-4 py-2 text-[10px] text-muted-foreground italic group-data-[collapsible=icon]:hidden">
                  独自のフィードを追加
                </p>
              )}
              {!user && (
                <p className="px-4 py-2 text-[10px] text-muted-foreground italic group-data-[collapsible=icon]:hidden">
                  ログインしてマイソースを追加
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/20 bg-muted/5">
        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:px-0">
              <Avatar className="h-9 w-9 border-2 border-primary/20 ring-2 ring-background">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user.displayName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-bold truncate leading-tight">{user.displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2 group-data-[collapsible=icon]:hidden">
              <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 font-bold border-border/50 hover:bg-secondary/50" onClick={handleLogout}>
                <LogOut className="w-3 h-3 mr-1" /> 終了
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-border/50">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={handleLogin} className="w-full gap-2 text-xs font-bold rounded-xl shadow-lg shadow-primary/20" size="sm">
            <LogIn className="w-4 h-4" /> ログイン
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
