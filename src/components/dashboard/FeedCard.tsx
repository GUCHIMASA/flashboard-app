"use client";

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Share2, Bookmark, BookmarkCheck, ExternalLink, Globe } from 'lucide-react';
import { TbWaveSawTool } from 'react-icons/tb';
import { IoReorderThree } from 'react-icons/io5';
import { PiWavesBold } from 'react-icons/pi';
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
    const shareText = `「${article.translatedTitle || article.title}」 ⚡${article.act || ''}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <Card 
      className={cn(
        "flex flex-col w-full bg-background border-border/40 transition-all duration-300 rounded-lg overflow-hidden group cursor-pointer",
        isActive 
          ? "ring-2 ring-primary/40 shadow-xl z-20 scale-[1.01] opacity-100" 
          : "opacity-60 hover:opacity-100 hover:border-border/80"
      )}
    >
      <CardHeader className={cn(
        "transition-all duration-300",
        isActive ? "p-4 space-y-3" : "p-2 space-y-1"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-4 h-4 rounded-sm overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {favicon ? (
                <img src={favicon} alt="" className="w-full h-full object-contain" />
              ) : (
                <Globe className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <span className="text-[10px] font-black text-primary truncate uppercase tracking-tight">
              {article.sourceName}
            </span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
        
        <h3 className={cn(
          "font-black leading-tight transition-all duration-300",
          isActive ? "text-xl text-primary" : "text-lg text-foreground truncate"
        )}>
          {article.translatedTitle || article.title}
        </h3>

        {(article.tags && article.tags.length > 0) && (
          <div className="flex flex-nowrap overflow-x-auto gap-1.5 py-1 no-scrollbar w-full">
            {article.tags.map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-[10px] py-0 px-2 h-5 border-muted/50 text-muted-foreground bg-muted/20 shrink-0 whitespace-nowrap"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className={cn(
        "px-4 transition-all duration-300 overflow-hidden",
        isActive ? "pb-4 opacity-100" : "max-h-0 p-0 opacity-0 pointer-events-none"
      )}>
        <div className="space-y-4 pt-2">
          {article.act && (
            <div className="flex items-start gap-2 text-sm leading-relaxed">
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                <TbWaveSawTool className="w-4 h-4" />
              </div>
              <p className="font-bold flex-1">▲{article.act}</p>
            </div>
          )}
          {article.context && (
            <div className="flex items-start gap-2 text-sm leading-relaxed">
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                <IoReorderThree className="w-4 h-4" />
              </div>
              <p className="text-foreground/90 flex-1">●{article.context}</p>
            </div>
          )}
          {article.effect && (
            <div className="flex items-start gap-2 text-sm leading-relaxed">
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                <PiWavesBold className="w-4 h-4" />
              </div>
              <p className="text-foreground/90 flex-1">■{article.effect}</p>
            </div>
          )}
        </div>
      </CardContent>

      {isActive && (
        <CardFooter className="p-4 pt-2 flex flex-col items-stretch mt-auto border-t border-border/10">
          <div className='flex items-center justify-end w-full'>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" onClick={handleBookmark} disabled={isBookmarked}>
                {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className='flex items-center justify-stretch w-full gap-2 pt-2'>
            <Button asChild variant="outline" size="sm" className="w-full h-10 font-bold" onClick={(e) => e.stopPropagation()}>
              <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                記事を読む <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full h-10 font-bold" onClick={(e) => e.stopPropagation()}>
              <a href={`https://translate.google.com/translate?u=${article.link}&sl=en&tl=ja`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                全文翻訳 <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}