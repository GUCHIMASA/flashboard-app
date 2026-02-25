
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
        "flex flex-col w-full bg-card border-border hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group",
        isActive 
          ? "ring-2 ring-primary/30 shadow-xl opacity-100 scale-[1.02]" 
          : "opacity-60 grayscale-[0.2] hover:opacity-90"
      )}
    >
      <CardHeader className={cn(
        "transition-all duration-300",
        isActive ? "p-4 space-y-3" : "p-3 space-y-1"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {favicon ? (
                <img src={favicon} alt="" className="w-full h-full object-contain" />
              ) : (
                <Globe className="w-2.5 h-2.5 text-muted-foreground" />
              )}
            </div>
            <span className="text-[10px] font-bold text-primary truncate max-w-[120px]">
              {article.sourceName}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
        
        <h3 className={cn(
          "font-bold leading-snug line-clamp-2 transition-all",
          isActive ? "text-base text-primary" : "text-sm text-foreground"
        )}>
          {article.title}
        </h3>

        {isActive && article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {article.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[8px] py-0 px-1 border-muted text-muted-foreground">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      {/* AI Insight エリア：アクティブ時のみ展開 */}
      <CardContent className={cn(
        "px-4 transition-all duration-300",
        isActive ? "pb-4 opacity-100" : "h-0 p-0 opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "grid transition-all duration-500 ease-in-out",
          isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}>
          <div className="overflow-hidden bg-muted/50 rounded-lg border border-border/50">
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5 text-primary">
                <Sparkles className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-wider">Quick Insight</span>
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

      {isActive && (
        <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto border-t border-border/10">
          <div className="flex items-center gap-1 pt-3">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleBookmark} disabled={isBookmarked}>
              {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => e.stopPropagation()}>
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button asChild variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold pt-3" onClick={(e) => e.stopPropagation()}>
            <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              記事を読む <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
