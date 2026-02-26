
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Bookmark, ArrowRight, Calendar, Info, Database, Tag as TagIcon, X } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { AddSourceDialog } from '@/components/dashboard/AddSourceDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { INITIAL_SOURCES } from './lib/mock-data';
import { Article, Category, FeedSource } from './lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, limit, orderBy } from 'firebase/firestore';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { syncRss } from '@/ai/flows/sync-rss-flow';
import Header from '@/components/header';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Link from 'next/link';

// 管理者用メールアドレス
const ADMIN_EMAIL = 'admin@example.com';

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const autoplay = useRef(Autoplay({ delay: 6000, stopOnInteraction: true }));
  const [api, setApi] = useState<CarouselApi>();
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // アクティブな記事のIDを管理 (タップで切り替え)
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  const sourcesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'sources');
  }, [db, user]);
  const { data: customSources } = useCollection(sourcesQuery);

  const allSources = useMemo(() => [
    ...INITIAL_SOURCES, 
    ...(customSources || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      category: 'Custom' as Category
    }))
  ], [customSources]);

  const articlesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(100));
  }, [db]);
  const { data: firestoreArticles, loading: articlesLoading } = useCollection(articlesQuery);

  const normalizedArticles = useMemo(() => {
    return ((firestoreArticles as any[]) || []).map(a => {
      let dateStr = a.publishedAt;
      if (!dateStr && a.createdAt?.toDate) {
        dateStr = a.createdAt.toDate().toISOString();
      }
      if (!dateStr) dateStr = new Date().toISOString();

      return {
        ...a,
        id: a.id,
        title: a.title || '無題',
        link: a.link || a.url || '#',
        category: a.category || 'Reliable',
        sourceName: a.sourceName || '不明',
        publishedAt: dateStr,
        imageUrl: a.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(a.title?.substring(0,5) || a.id)}/800/400`,
        tags: a.tags || []
      } as Article;
    });
  }, [firestoreArticles]);

  const bookmarkedItemsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'bookmarks');
  }, [db, user]);
  const { data: bookmarkedItems } = useCollection(bookmarkedItemsQuery);

  const bookmarkedArticles: Article[] = (bookmarkedItems || []).map((b: any) => ({
    id: b.id,
    title: b.title || '無題',
    translatedTitle: b.translatedTitle,
    content: b.content || '',
    act: b.act,
    context: b.context,
    effect: b.effect,
    sourceName: b.sourceName || '不明',
    publishedAt: b.bookmarkedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    category: 'Bookmarks', 
    link: b.link || b.url || '#',
    imageUrl: b.imageUrl || `https://picsum.photos/seed/${b.id}/800/400`,
    tags: b.tags || []
  }));

  const displayArticles = activeCategory === 'Bookmarks' ? bookmarkedArticles : normalizedArticles;

  const filteredArticles = useMemo(() => {
    return displayArticles.filter(a => {
      if (activeCategory !== 'All' && activeCategory !== 'Bookmarks') {
        if (a.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
      }
      if (selectedSourceName && a.sourceName !== selectedSourceName) return false;
      if (selectedTag && !a.tags?.includes(selectedTag)) return false;
      const searchTarget = `${a.title} ${a.content} ${a.sourceName}`.toLowerCase();
      if (searchQuery && !searchTarget.includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [displayArticles, activeCategory, selectedSourceName, selectedTag, searchQuery]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    // 権限チェック (安全策)
    if (user?.email !== ADMIN_EMAIL) {
      toast({ variant: "destructive", title: "権限エラー", description: "この操作は管理者のみ可能です。" });
      return;
    }

    setIsRefreshing(true);
    toast({ title: "同期を開始しました", description: "最新情報を翻訳・要約中..." });

    try {
      const result = await syncRss({ 
        sources: allSources,
        requesterEmail: user?.email || ''
      });
      toast({ 
        title: result.addedCount > 0 || result.updatedCount > 0 ? "同期完了" : "更新なし", 
        description: `${result.addedCount + result.updatedCount}件の記事を処理しました。` 
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "同期エラー", description: error.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSourceSelect = (source: FeedSource | 'All') => {
    if (source === 'All') {
      setActiveCategory('All');
      setSelectedSourceName(null);
    } else {
      setActiveCategory(source.category);
      setSelectedSourceName(source.name);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
      <DashboardSidebar 
        activeCategory={activeCategory as any} 
        selectedSourceName={selectedSourceName}
        onSelectSource={handleSourceSelect}
        onDeleteSource={(id) => {
          if (db && user) {
            deleteDoc(doc(db, 'users', user.uid, 'sources', id));
          }
        }}
        sources={allSources}
        onAddSource={() => user ? setIsAddSourceOpen(true) : toast({ variant: "destructive", title: "ログインが必要です", description: "カスタムソースを追加するにはログインしてください。" })}
      />

      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <Header />
        <div className="flex-1 p-4 md:p-8 space-y-4 max-w-[1600px] mx-auto w-full">
          {activeCategory === 'All' && !selectedSourceName && !selectedTag && normalizedArticles.length > 0 && (
            <section className="relative overflow-hidden rounded-3xl shadow-xl mb-6">
              <Carousel className="w-full" opts={{ loop: true }} plugins={[autoplay.current]} setApi={setApi}>
                <CarouselContent>
                  {normalizedArticles.slice(0, 5).map((article) => (
                    <CarouselItem key={article.id}>
                      <div className="relative h-[250px] md:h-[400px] w-full overflow-hidden">
                        <Image 
                          src={article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/800`} 
                          alt={article.title}
                          fill
                          className="object-cover"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-primary border-none text-[10px] h-5">{article.sourceName}</Badge>
                            <span className="text-[10px] text-white/70 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(article.publishedAt), 'MM/dd HH:mm')}
                            </span>
                          </div>
                          <h1 className="text-2xl md:text-4xl font-black mb-3 text-white line-clamp-2 leading-tight">
                            {article.translatedTitle || article.title}
                          </h1>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v)} className="bg-muted p-0.5 rounded-full">
                  <TabsList className="bg-transparent h-8">
                    <TabsTrigger value="All" className="rounded-full px-3 text-xs">すべて</TabsTrigger>
                    <TabsTrigger value="Reliable" className="rounded-full px-3 text-xs">信頼</TabsTrigger>
                    <TabsTrigger value="Discovery" className="rounded-full px-3 text-xs">発見</TabsTrigger>
                    <TabsTrigger value="Bookmarks" className="rounded-full px-2"><Bookmark className="w-3.5 h-3.5" /></TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="bg-muted px-2 py-1 rounded-full text-[9px] font-bold text-muted-foreground flex items-center gap-1.5">
                  <Database className="w-2.5 h-2.5 text-primary" />
                  {filteredArticles.length} 件
                </div>
                {/* 管理者（admin@example.com）のみ同期ボタンを表示 */}
                {user?.email === ADMIN_EMAIL && (
                  <Button variant="outline" size="sm" className="rounded-full h-8 text-xs border-primary/30 hover:bg-primary/5" onClick={handleRefresh} disabled={isRefreshing}>
                    {isRefreshing ? "同期中..." : "最新記事を取得"}
                  </Button>
                )}
              </div>
            </div>

            {articlesLoading && filteredArticles.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {filteredArticles.map((article) => (
                  <div 
                    key={article.id} 
                    onClick={() => setActiveArticleId(activeArticleId === article.id ? null : article.id)}
                    className="transition-all duration-300"
                  >
                    <FeedCard 
                      article={article} 
                      isActive={activeArticleId === article.id}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-muted/10 rounded-3xl border border-dashed border-muted">
                <Info className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold mb-1">該当する記事はありません</h3>
                <p className="text-xs text-muted-foreground mb-6">条件を変更してお試しください。</p>
              </div>
            )}
          </section>

          <footer className="py-12 border-t border-border/50 text-center space-y-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              © 2024 AI SYNAPSE - Next-Gen Intelligence Dashboard
            </p>
            <div className="flex items-center justify-center gap-6">
              <Link href="/terms" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">利用規約</Link>
              <Link href="/privacy" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">プライバシーポリシー</Link>
            </div>
          </footer>
        </div>
      </main>

      <AddSourceDialog 
        open={isAddSourceOpen} 
        onOpenChange={setIsAddSourceOpen} 
        onAdd={(s) => {
          if (!user) return;
          addDoc(collection(db, 'users', user.uid, 'sources'), { ...s, createdAt: serverTimestamp() });
        }}
      />
    </div>
  );
}
