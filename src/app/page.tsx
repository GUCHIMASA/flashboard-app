
"use client";

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Filter, Sparkles, BrainCircuit } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { AddSourceDialog } from '@/components/dashboard/AddSourceDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { INITIAL_SOURCES, MOCK_ARTICLES } from './lib/mock-data';
import { Article, Category, FeedSource } from './lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sources, setSources] = useState<FeedSource[]>(INITIAL_SOURCES);
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredArticles = articles
    .filter(a => activeCategory === 'All' || a.category === activeCategory)
    .filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sourceName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const handleAddSource = (newSource: Omit<FeedSource, 'id'>) => {
    const id = (sources.length + 1).toString();
    setSources([...sources, { ...newSource, id }]);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API fetch delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-accent/30">
      <DashboardSidebar 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
        sources={sources}
        onAddSource={() => setIsAddSourceOpen(true)}
      />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <h2 className="font-headline text-2xl font-bold text-primary whitespace-nowrap">
              {activeCategory} Feed
            </h2>
            <div className="hidden lg:flex items-center gap-2 bg-secondary/40 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Updated just now
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64 lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-inner" 
                placeholder="Search AI insights..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="hidden sm:flex border-border/50 bg-background hover:bg-secondary/20"
              onClick={handleRefresh}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        {/* Hero Section (Only on All) */}
        {activeCategory === 'All' && !searchQuery && (
          <div className="px-6 pt-8 pb-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-primary-foreground shadow-xl">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  <Sparkles className="w-3 h-3" />
                  What's New in AI
                </div>
                <h1 className="font-headline text-4xl font-bold mb-4 tracking-tight leading-tight">
                  Decode the Intelligence. <br/> Stay Ahead of the Curve.
                </h1>
                <p className="text-primary-foreground/80 text-lg mb-6 leading-relaxed">
                  Real-time aggregation from world-leading labs and discovery platforms. 
                  Summarized by Gemini for high-velocity information consumption.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-white text-primary hover:bg-white/90 font-bold px-6">
                    Analyze Latest Trends
                  </Button>
                  <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white px-6">
                    Explore Sources
                  </Button>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                <BrainCircuit className="w-full h-full -rotate-12 translate-x-1/4" />
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <Tabs value={activeCategory} onValueChange={(val) => setActiveCategory(val as Category | 'All')}>
              <TabsList className="bg-muted/30 p-1">
                <TabsTrigger value="All" className="data-[state=active]:bg-background data-[state=active]:text-primary font-medium">Timeline</TabsTrigger>
                <TabsTrigger value="Reliable" className="data-[state=active]:bg-background data-[state=active]:text-primary font-medium">Reliable</TabsTrigger>
                <TabsTrigger value="Discovery" className="data-[state=active]:bg-background data-[state=active]:text-primary font-medium">Discovery</TabsTrigger>
                <TabsTrigger value="Custom" className="data-[state=active]:bg-background data-[state=active]:text-primary font-medium">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>{filteredArticles.length} results</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <FeedCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/40 text-muted-foreground">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">No results found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search keywords.</p>
                </div>
                <Button variant="outline" onClick={() => {setSearchQuery(''); setActiveCategory('All');}}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <AddSourceDialog 
        open={isAddSourceOpen} 
        onOpenChange={setIsAddSourceOpen} 
        onAdd={handleAddSource}
      />
    </div>
  );
}
