
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
import { ThemeToggle } from './ThemeToggle';

interface DashboardSidebarProps {
  activeCategory: Category | 'All' | 'Bookmarks';
  selectedSourceName: string | null;
  onSelectSource: (source: FeedSource | 'All') => void;
  onDeleteSource?: (sourceId: string) => void;
  sources: FeedSource[];
  onAddSource: () => void;
}

/**
 * 取得元のアイコンを管理するコンポーネント
 * 折りたたみ時の整列を保つためサイズを固定
 */
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
      "w-6 h-6 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center border border-white/5 transition-colors",
      isActive && "border-primary/50 bg-primary/10"
    )}>
      {favicon ? (
        <img src={favicon} alt={name} className="w-4 h-4 object-contain" />
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
  onAddSource
}: DashboardSidebarProps) {
  const { user } = useUser();
  const { toast } = useToast();

  const reliableSources = sources.filter(s => s.category === 'Reliable');
  const discoverySources = sources.filter(s => s.category === 'Discovery');
  const customSources = sources.filter(s => s.category === 'Custom');

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-card/60 backdrop-blur-3xl">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary p-1.5 rounded-lg shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-headline text-lg font-black tracking-tighter text-foreground group-data-[collapsible=icon]:hidden uppercase truncate">
            FLASHBOARD
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 group-data-[collapsible=icon]:hidden">
            メインメニュー
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeCategory === 'All' && !selectedSourceName} 
                onClick={() => onSelectSource('All')}
                tooltip="タイムライン"
                className="h-10 data-[active=true]:bg-primary/5 data-[active=true]:text-primary"
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span className="font-bold group-data-[collapsible=icon]:hidden">ストリーム</span>
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
                className="h-10 data-[active=true]:bg-primary/5 data-[active=true]:text-primary"
              >
                <Bookmark className="w-5 h-5 shrink-0" />
                <span className="font-bold group-data-[collapsible=icon]:hidden">保管庫</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 my-2 bg-white/5" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <span>信頼ソース</span>
            <ShieldCheck className="w-3 h-3 text-primary" />
          </SidebarGroupLabel>
          <SidebarMenu>
            {reliableSources.map((source) => (
              <SidebarMenuItem key={source.id}>
                <SidebarMenuButton 
                  className="h-10 rounded-xl"
                  isActive={selectedSourceName === source.name}
                  onClick={() => onSelectSource(source)}
                  tooltip={source.name}
                >
                  <SourceIcon url={source.url} name={source.name} isActive={selectedSourceName === source.name} />
                  <span className="truncate text-xs font-medium group-data-[collapsible=icon]:hidden">{source.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <span>ディスカバリー</span>
            <Sparkles className="w-3 h-3 text-accent" />
          </SidebarGroupLabel>
          <SidebarMenu>
            {discoverySources.map((source) => (
              <SidebarMenuItem key={source.id}>
                <SidebarMenuButton 
                  className="h-10 rounded-xl"
                  isActive={selectedSourceName === source.name}
                  onClick={() => onSelectSource(source)}
                  tooltip={source.name}
                >
                  <SourceIcon url={source.url} name={source.name} isActive={selectedSourceName === source.name} />
                  <span className="truncate text-xs font-medium group-data-[collapsible=icon]:hidden">{source.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 flex items-center justify-between group-data-[collapsible=icon]:hidden">
              <span>カスタム設定</span>
              <Plus 
                onClick={(e) => { e.stopPropagation(); onAddSource(); }} 
                className="w-4 h-4 text-primary cursor-pointer hover:scale-125 transition-transform" 
              />
            </SidebarGroupLabel>
            <SidebarMenu>
              {customSources.map((source) => (
                <SidebarMenuItem key={source.id} className="group/item flex items-center">
                  <SidebarMenuButton 
                    className="h-10 rounded-xl flex-1"
                    isActive={selectedSourceName === source.name}
                    onClick={() => onSelectSource(source)}
                    tooltip={source.name}
                  >
                    <SourceIcon url={source.url} name={source.name} isActive={selectedSourceName === source.name} />
                    <span className="truncate text-xs font-medium group-data-[collapsible=icon]:hidden">{source.name}</span>
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

        <SidebarSeparator className="mx-4 my-2 bg-white/5" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 group-data-[collapsible=icon]:hidden">
            サポート
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="利用規約">
                <Link href="/terms" className="h-10">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="text-xs group-data-[collapsible=icon]:hidden">利用規約</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="プライバシー">
                <Link href="/privacy" className="h-10">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span className="text-xs group-data-[collapsible=icon]:hidden">プライバシー</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5 flex flex-col items-center gap-4">
        {/* ダークモード・ライトモード切り替えボタン */}
        <ThemeToggle />
        
        <div className="flex flex-col items-center justify-center gap-1 group-data-[collapsible=icon]:hidden text-center">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            FLASHBOARD v1.0
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
