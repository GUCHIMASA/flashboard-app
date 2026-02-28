
"use client";

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Share2, Bookmark, BookmarkCheck, ExternalLink, Globe, Zap, Search, Waves } from 'lucide-react';
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
      translatedTitle: article.translatedTitle,
      content: article.content,
      act: article.act,
      context: article.context,
      effect: article.effect,
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/article/${article.id}`;
    const shareText = `「${article.translatedTitle || article.title}」 #Flashboard`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const translateUrl = `https://translate.google.com/translate?sl=auto&tl=ja&u=${encodeURIComponent(article.link)}`;

  return (
    <Card 
      className={cn(
        "flex flex-col w-full bg-background border-border/40 transition-all duration-300 rounded-lg overflow-hidden group cursor-pointer",
        isActive 
          ? "ring-2 ring-primary/40 shadow-xl z-20 opacity-100" 
          : "opacity-70 hover:opacity-100 hover:border-border/80"
      )}
    >
      <CardHeader className={cn(
        "transition-all duration-300",
        isActive ? "p-4 space-y-3" : "p-2 space-y-1.5"
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
            <span className="text-[10px] font-black text-primary truncate uppercase tracking-tight">
              {article.sourceName}
            </span>
          </div>
          <span className="text-[9px] font-medium text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
        
        <h3 className={cn(
          "font-black leading-tight transition-all duration-300",
          isActive ? "text-lg text-primary" : "text-base text-foreground truncate"
        )}>
          {article.translatedTitle || article.title}
        </h3>

        {(article.tags && article.tags.length > 0) && (
          <div className="flex flex-nowrap overflow-x-auto gap-1 py-0.5 no-scrollbar w-full">
            {article.tags.map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-[9px] py-0 px-1.5 h-4 border-muted/50 text-muted-foreground bg-muted/20 shrink-0 whitespace-nowrap font-bold"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
      )}>
        <div className="overflow-hidden">
          <CardContent className="px-4 pb-4">
            <div className="space-y-4 pt-2 border-t border-border/10">
              {article.act && (
                <div className="flex items-start gap-3 text-sm leading-relaxed">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Zap className="w-4 h-4" />
                  </div>
                  <p className="font-bold flex-1 text-base leading-snug">{article.act}</p>
                </div>
              )}
              {article.context && (
                <div className="flex items-start gap-3 text-sm leading-relaxed">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Search className="w-4 h-4" />
                  </div>
                  <p className="text-foreground/90 flex-1">{article.context}</p>
                </div>
              )}
              {article.effect && (
                <div className="flex items-start gap-3 text-sm leading-relaxed">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Waves className="w-4 h-4" />
                  </div>
                  <p className="text-foreground/90 flex-1">{article.effect}</p>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-2 flex flex-col items-stretch mt-auto border-t border-border/10">
            <div className='flex items-center justify-between w-full gap-2'>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" onClick={handleBookmark} disabled={isBookmarked}>
                  {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1 h-9 font-black text-[10px] px-2" onClick={(e) => e.stopPropagation()}>
                  <a href={translateUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 justify-center">
                    <Globe className="h-3.5 w-3.5" /> 翻訳
                  </a>
                </Button>
                <Button asChild variant="default" size="sm" className="flex-1 h-9 font-black text-[10px] px-2" onClick={(e) => e.stopPropagation()}>
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 justify-center">
                    元記事 <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
