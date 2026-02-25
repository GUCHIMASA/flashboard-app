
"use client";

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Share2, Bookmark, BookmarkCheck, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/app/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FeedCardProps {
  article: Article;
  isActive?: boolean;
}

export function FeedCard({ article, isActive = false }: FeedCardProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!db || !user) {
      toast({
        variant: "destructive",
        title: "ログインが必要です",
        description: "ブックマークするにはログインしてください。",
      });
      return;
    }
    
    addDoc(collection(db, 'users', user.uid, 'bookmarks'), {
      articleId: article.id,
      title: article.title,
      content: article.content,
      summary: article.summary,
      url: article.link,
      sourceName: article.sourceName,
      imageUrl: article.imageUrl || '',
      tags: article.tags || [],
      bookmarkedAt: serverTimestamp(),
    });
    setIsBookmarked(true);
    toast({
      title: "保存しました",
      description: "ブックマークに追加されました。",
    });
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  const favicon = getFaviconUrl(article.link);

  return (
    <Card 
      className={cn(
        "flex flex-col w-full bg-background border-border/40 transition-all duration-300 rounded-lg overflow-hidden group cursor-pointer",
        isActive 
          ? "ring-2 ring-primary/40 shadow-xl z-20 scale-[1.01] opacity-100" 
          : "opacity-80 hover:opacity-100 hover:border-border/80"
      )}
    >
      <CardHeader className={cn(
        "transition-all duration-300",
        isActive ? "p-4 space-y-3" : "p-2 space-y-0.5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-4 h-4 rounded-sm overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {favicon ? (
                <img src={favicon} alt="" className="w-full h-full object-contain" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <span className="text-[12px] font-black text-primary truncate uppercase tracking-tight">
              {article.sourceName}
            </span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
        
        <h3 className={cn(
          "font-black leading-tight transition-all duration-300",
          isActive ? "text-lg text-primary" : "text-sm text-foreground line-clamp-1"
        )}>
          {article.title}
        </h3>

        {isActive && article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {article.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px] py-0 px-2 h-5 border-muted/50 text-muted-foreground bg-muted/20">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      {/* AI Insight エリア */}
      <CardContent className={cn(
        "px-4 transition-all duration-300",
        isActive ? "pb-4 opacity-100" : "h-0 p-0 opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "grid transition-all duration-300 ease-in-out",
          isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}>
          <div className="overflow-hidden bg-primary/5 rounded-xl border border-primary/10">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">Quick Insight</span>
              </div>
              {article.summary ? (
                <p className="text-sm text-foreground/90 leading-relaxed font-semibold">
                  {article.summary}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">要約を生成中...</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {isActive && (
        <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto border-t border-border/10">
          <div className="flex items-center gap-2 pt-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" onClick={handleBookmark} disabled={isBookmarked}>
              {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" onClick={(e) => e.stopPropagation()}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs font-black pt-3 text-primary hover:text-primary/80" onClick={(e) => e.stopPropagation()}>
            <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
              記事をフルで読む <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
