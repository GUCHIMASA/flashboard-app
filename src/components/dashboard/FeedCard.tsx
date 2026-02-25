
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
        "flex flex-col w-full bg-background border-border/40 transition-all duration-200 rounded-lg overflow-hidden group",
        isActive 
          ? "ring-1 ring-primary/40 shadow-lg z-10 scale-[1.01]" 
          : "opacity-70 hover:opacity-100 hover:border-border"
      )}
    >
      <CardHeader className={cn(
        "transition-all duration-200",
        isActive ? "p-3 space-y-2" : "p-2 space-y-0.5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="w-3 h-3 rounded-sm overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {favicon ? (
                <img src={favicon} alt="" className="w-full h-full object-contain" />
              ) : (
                <Globe className="w-2.5 h-2.5 text-muted-foreground" />
              )}
            </div>
            <span className="text-[9px] font-bold text-primary truncate">
              {article.sourceName}
            </span>
          </div>
          <span className="text-[8px] text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
        
        <h3 className={cn(
          "font-bold leading-tight transition-all",
          isActive ? "text-sm text-primary" : "text-[11px] text-foreground line-clamp-1"
        )}>
          {article.title}
        </h3>

        {isActive && article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {article.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[8px] py-0 px-1 h-4 border-muted text-muted-foreground">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      {/* AI Insight エリア：アクティブ時のみ展開 */}
      <CardContent className={cn(
        "px-3 transition-all duration-300",
        isActive ? "pb-3 opacity-100" : "h-0 p-0 opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "grid transition-all duration-300 ease-in-out",
          isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}>
          <div className="overflow-hidden bg-muted/40 rounded border border-border/30">
            <div className="p-2">
              <div className="flex items-center gap-1.5 mb-1 text-primary">
                <Sparkles className="w-2.5 h-2.5" />
                <span className="text-[8px] font-black uppercase tracking-wider">Quick Insight</span>
              </div>
              {article.summary ? (
                <p className="text-[11px] text-foreground/90 leading-relaxed">
                  {article.summary}
                </p>
              ) : (
                <p className="text-[9px] text-muted-foreground italic">要約を生成中...</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {isActive && (
        <CardFooter className="p-3 pt-0 flex items-center justify-between mt-auto border-t border-border/10">
          <div className="flex items-center gap-1 pt-2">
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleBookmark} disabled={isBookmarked}>
              {isBookmarked ? <BookmarkCheck className="h-3 w-3 text-primary" /> : <Bookmark className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={(e) => e.stopPropagation()}>
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
          <Button asChild variant="link" size="sm" className="h-auto p-0 text-[9px] font-bold pt-2" onClick={(e) => e.stopPropagation()}>
            <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              記事を読む <ExternalLink className="h-2 w-2" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
