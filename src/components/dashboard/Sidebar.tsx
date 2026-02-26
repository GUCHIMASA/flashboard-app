
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
  FileText,
  Lock
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
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
  const { user } = useUser();
  const { toast } = useToast();

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
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-card/60 backdrop-blur-3xl">
      <SidebarHeader className="h-20 flex items-center px-4 md:px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl neo-blur animate-float shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-headline text-xl font-black tracking-tighter text-foreground group-data-[collapsible=icon]:hidden uppercase truncate">
            FLASHBOARD
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-8">
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 group-data-[collapsible=icon]:hidden">
            メインメニュー
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeCategory === 'All' && !selectedSourceName} 
                onClick={() => onSelectSource('All')}
                tooltip="タイムライン"
                className="h-12 px-6 rounded-none border-l-2 border-transparent data-[active=true]:border-primary data-[active=true]:bg-primary/5"
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span className="font-bold">ストリーム</span>
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
                tooltip="ブックマーク"
                className="h-12 px-6 rounded-none border-l-2 border-transparent data-[active=true]:border-primary data-[active=true]:bg-primary/5"
              >
                <Bookmark className="w-5 h-5 shrink-0" />
                <span className="font-bold">保管庫</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-6 my-4 bg-white/5 group-data-[collapsible=icon]:mx-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <span>信頼ソース</span>
            <ShieldCheck className="w-3 h-3 text-primary" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 group-data-[collapsible=icon]:px-1">
              {reliableSources.map((source) => {
                const favicon = getFaviconUrl(source.url);
                return (
                  <SidebarMenuItem key={source.id}>
                    <SidebarMenuButton 
                      className="h-10 rounded-xl hover:bg-white/5"
                      isActive={selectedSourceName === source.name}
                      onClick={() => onSelectSource(source)}
                      tooltip={source.name}
                    >
                      <div className="w-6 h-6 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center border border-white/5 group-data-[active=true]:border-primary/50 transition-colors">
                        {favicon ? (
                          <img src={favicon} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="truncate text-xs font-medium opacity-70 group-data-[active=true]:opacity-100 group-data-[collapsible=icon]:hidden">{source.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <span>ディスカバリー</span>
            <Sparkles className="w-3 h-3 text-accent" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 group-data-[collapsible=icon]:px-1">
              {discoverySources.map((source) => {
                const favicon = getFaviconUrl(source.url);
                return (
                  <SidebarMenuItem key={source.id}>
                    <SidebarMenuButton 
                      className="h-10 rounded-xl hover:bg-white/5"
                      isActive={selectedSourceName === source.name}
                      onClick={() => onSelectSource(source)}
                      tooltip={source.name}
                    >
                      <div className="w-6 h-6 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center border border-white/5 group-data-[active=true]:border-primary/50 transition-colors">
                        {favicon ? (
                          <img src={favicon} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="truncate text-xs font-medium opacity-70 group-data-[active=true]:opacity-100 group-data-[collapsible=icon]:hidden">{source.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 flex items-center justify-between group-data-[collapsible=icon]:hidden">
              <span>カスタム設定</span>
              <Plus 
                onClick={(e) => { e.stopPropagation(); onAddSource(); }} 
                className="w-4 h-4 text-primary cursor-pointer hover:scale-125 transition-transform" 
              />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-3 group-data-[collapsible=icon]:px-1">
                {customSources.map((source) => {
                  const favicon = getFaviconUrl(source.url);
                  return (
                    <SidebarMenuItem key={source.id}>
                      <div className="flex items-center group/item">
                        <SidebarMenuButton 
                          className="h-10 rounded-xl flex-1 hover:bg-white/5"
                          isActive={selectedSourceName === source.name}
                          onClick={() => onSelectSource(source)}
                          tooltip={source.name}
                        >
                          <div className="w-6 h-6 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center border border-white/5">
                            {favicon ? (
                              <img src={favicon} alt="" className="w-4 h-4 object-contain" />
                            ) : (
                              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="truncate text-xs font-medium group-data-[collapsible=icon]:hidden">{source.name}</span>
                        </SidebarMenuButton>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteSource) onDeleteSource(source.id);
                          }}
                          className="opacity-0 group-hover/item:opacity-100 p-2 hover:text-destructive transition-all group-data-[collapsible=icon]:hidden"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator className="mx-6 my-4 bg-white/5 group-data-[collapsible=icon]:mx-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 group-data-[collapsible=icon]:hidden">
            サポート
          </SidebarGroupLabel>
          <SidebarMenu className="px-3 group-data-[collapsible=icon]:px-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="利用規約">
                <Link href="/terms" className="h-10 rounded-xl">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="text-xs group-data-[collapsible=icon]:hidden">利用規約</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="プライバシー">
                <Link href="/privacy" className="h-10 rounded-xl">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span className="text-xs group-data-[collapsible=icon]:hidden">プライバシー</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-white/5 group-data-[collapsible=icon]:p-2">
        <div className="flex flex-col items-center justify-center gap-1 group-data-[collapsible=icon]:hidden">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            FLASHBOARD v1.0
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-[8px] font-bold text-muted-foreground/40 hover:text-primary">規約</Link>
            <Link href="/privacy" className="text-[8px] font-bold text-muted-foreground/40 hover:text-primary">プライバシー</Link>
          </div>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary/40" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
