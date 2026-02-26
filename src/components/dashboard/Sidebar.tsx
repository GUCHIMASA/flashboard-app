"use client";

import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  LayoutDashboard, 
  Plus,
  Zap,
  Bookmark,
  Globe,
  Trash2,
  Database,
  RefreshCw
} from 'lucide-react';
import { Category, FeedSource } from '@/app/lib/types';
import { useUser } from '@/firebase';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardSidebarProps {
  activeCategory: Category | 'All' | 'Bookmarks';
  selectedSourceName: string | null;
  onSelectSource: (source: FeedSource | 'All') => void;
  onDeleteSource?: (sourceId: string) => void;
  sources: FeedSource[];
  onAddSource: () => void;
  articleCount?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

const SourceIcon = ({ url, name, isActive }: { url: string; name: string; isActive?: boolean }) => {
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  const favicon = getFaviconUrl(url);

  return (
    <div className={cn(
      "w-5 h-5 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center border border-white/5 transition-all",
      isActive && "border-primary/50 bg-primary/20 scale-110"
    )}>
      {favicon ? (
        <img src={favicon} alt={name} className="w-3.5 h-3.5 object-contain" />
      ) : (
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </div>
  );
};

export function DashboardSidebar({ 
  activeCategory, 
  selectedSourceName,
  onSelectSource, 
  onDeleteSource,
  sources,
  onAddSource,
  articleCount = 0,
  isRefreshing = false,
  onRefresh,
  isAdmin = false
}: DashboardSidebarProps) {
  const { user } = useUser();
  const { toast } = useToast();

  const reliableSources = sources.filter(s => s.category === 'Reliable');
  const discoverySources = sources.filter(s => s.category === 'Discovery');
  const customSources = sources.filter(s => s.category === 'Custom');

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-card/40 backdrop-blur-3xl">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary p-1.5 rounded-xl shrink-0 shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-headline text-lg font-black tracking-tighter text-foreground group-data-[collapsible=icon]:hidden uppercase truncate">
            FLASHBOARD
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 mb-3 group-data-[collapsible=icon]:hidden">
            メインメニュー
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeCategory === 'All' && !selectedSourceName} 
                onClick={() => onSelectSource('All')}
                tooltip="ストリーム"
                className="h-11 rounded-xl data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span className="font-black text-xs uppercase tracking-widest group-data-[collapsible=icon]:hidden">ストリーム</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeCategory === 'Bookmarks'} 
                onClick={() => {
                  if (!user) {
                    toast({ title: "ログインが必要です", description: "ブックマークを見るにはログインしてください。" });
                    return;
                  }
                  onSelectSource({ id: 'bookmarks', name: 'Bookmarks', url: '', category: 'Bookmarks' as any });
                }}
                tooltip="保管庫"
                className="h-11 rounded-xl data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
              >
                <Bookmark className="w-5 h-5 shrink-0" />
                <span className="font-black text-xs uppercase tracking-widest group-data-[collapsible=icon]:hidden">保管庫</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 my-4 bg-white/5" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 mb-3 flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <span>信頼</span>
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          </SidebarGroupLabel>
          <SidebarMenu>
            {reliableSources.map((source) => (
              <SidebarMenuItem key={source.id}>
                <SidebarMenuButton 
                  className="h-11 rounded-xl"
                  isActive={selectedSourceName === source.name}
                  onClick={() => onSelectSource(source)}
                  tooltip={source.name}
                >
                  <SourceIcon url={source.url} name={source.name} isActive={selectedSourceName === source.name} />
                  <span className="truncate text-[11px] font-bold group-data-[collapsible=icon]:hidden">{source.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 mb-3 flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <span>発見</span>
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </SidebarGroupLabel>
          <SidebarMenu>
            {discoverySources.map((source) => (
              <SidebarMenuItem key={source.id}>
                <SidebarMenuButton 
                  className="h-11 rounded-xl"
                  isActive={selectedSourceName === source.name}
                  onClick={() => onSelectSource(source)}
                  tooltip={source.name}
                >
                  <SourceIcon url={source.url} name={source.name} isActive={selectedSourceName === source.name} />
                  <span className="truncate text-[11px] font-bold group-data-[collapsible=icon]:hidden">{source.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 mb-3 flex items-center justify-between group-data-[collapsible=icon]:hidden">
              <span>カスタム</span>
              <Plus 
                onClick={(e) => { e.stopPropagation(); onAddSource(); }} 
                className="w-4 h-4 text-primary cursor-pointer hover:rotate-90 transition-transform" 
              />
            </SidebarGroupLabel>
            <SidebarMenu>
              {customSources.map((source) => (
                <SidebarMenuItem key={source.id} className="group/item flex items-center">
                  <SidebarMenuButton 
                    className="h-11 rounded-xl flex-1"
                    isActive={selectedSourceName === source.name}
                    onClick={() => onSelectSource(source)}
                    tooltip={source.name}
                  >
                    <SourceIcon url={source.url} name={source.name} isActive={selectedSourceName === source.name} />
                    <span className="truncate text-[11px] font-bold group-data-[collapsible=icon]:hidden">{source.name}</span>
                  </SidebarMenuButton>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteSource) onDeleteSource(source.id);
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-2 hover:text-destructive transition-all group-data-[collapsible=icon]:hidden shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5 flex flex-col items-stretch gap-6">
        <div className="flex flex-col gap-4 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <Database className="w-3.5 h-3.5 text-primary" />
              ステータス
            </div>
            <Badge variant="secondary" className="text-[10px] font-black px-3 py-0.5 h-5 bg-primary/10 text-primary border-none rounded-full">
              {articleCount}
            </Badge>
          </div>
          
          {isAdmin && onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full rounded-2xl h-10 text-[10px] font-black border-primary/20 hover:bg-primary/5 gap-2 uppercase tracking-widest transition-all hover:scale-[1.02]" 
              onClick={onRefresh} 
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              {isRefreshing ? "同期中..." : "今すぐ同期"}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <ThemeToggle />
          <div className="flex flex-col items-center justify-center gap-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
              FLASHBOARD v1.0
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
