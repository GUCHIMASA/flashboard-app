
"use client";

import React, { useState, useEffect } from 'react';
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
    e.stopPropagation(); // 親の onClick イベントを防ぐ
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
        "flex flex-col h-full bg-card border-border hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group",
        isActive ? "ring-2 ring-primary/20 shadow-xl" : "opacity-90 grayscale-[0.3]"
      )}
    >
      <CardHeader className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm overflow-hidden bg-muted flex items-center justify-center">
              {favicon ? (
                <img src={favicon} alt="" className="w-full h-full object-contain" />
              ) : (
                <Globe className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs font-bold text-primary truncate">
              {article.sourceName}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
        <h3 className={cn(
          "text-base font-bold leading-tight line-clamp-2 transition-colors",
          isActive ? "text-primary" : "text-foreground"
        )}>
          {article.title}
        </h3>
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[9px] py-0 px-1.5 border-muted text-muted-foreground">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      {/* AI Insight エリア：アクティブな時だけ展開される */}
      <CardContent className="px-4 py-0 flex-grow">
        <div className={cn(
          "grid transition-all duration-500 ease-in-out",
          isActive ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden bg-muted/50 rounded-xl border border-border/50">
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5 text-primary">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-wider">AI Insight</span>
              </div>
              {article.summary ? (
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {article.summary}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">要約を生成中...</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-2 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleBookmark} disabled={isBookmarked}>
            {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => e.stopPropagation()}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
            記事を読む <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
