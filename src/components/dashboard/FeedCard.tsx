
"use client";

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Share2, Bookmark, BookmarkCheck, Sparkles, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/app/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FeedCardProps {
  article: Article;
}

export function FeedCard({ article }: FeedCardProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmark = () => {
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

  const categoryLabels: Record<string, string> = {
    'Reliable': '信頼',
    'Discovery': '発見',
    'Custom': 'カスタム'
  };

  return (
    <Card className="group relative flex flex-col h-full border-white/5 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
      
      <CardHeader className="p-3 md:p-5 pb-2">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary-foreground text-[8px] md:text-[10px] uppercase font-bold border-none px-2 py-0.5 rounded-md">
            {categoryLabels[article.category] || article.category}
          </Badge>
          <span className="text-[8px] md:text-[10px] font-medium text-muted-foreground/80">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-[9px] md:text-xs font-bold text-primary/80 uppercase tracking-tighter">{article.sourceName}</span>
          </div>
          <h3 className="font-headline text-[12px] md:text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
        </div>

        {/* タグ表示 */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {article.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[8px] py-0 px-1.5 border-white/10 text-muted-foreground/80 font-normal">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="px-3 md:px-5 py-2 flex-grow">
        <div className="relative bg-white/5 border border-white/5 rounded-2xl p-3 md:p-5 overflow-hidden group/summary">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-[30px] rounded-full group-hover/summary:bg-primary/20 transition-all" />
          
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">AI 要約インサイト</span>
          </div>

          {article.summary ? (
            <div className="text-[11px] md:text-[14px] text-foreground/90 leading-relaxed font-medium whitespace-pre-line relative z-10">
              {article.summary}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">解析中...</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-3 md:px-5 py-3 md:py-4 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/5">
            <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8 rounded-full transition-all", isBookmarked ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/5")}
            onClick={handleBookmark}
            disabled={isBookmarked}
          >
            {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <Button asChild variant="link" size="sm" className="text-[10px] md:text-xs font-bold text-primary p-0 h-auto hover:no-underline group/link">
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
            全文を読む
            <ExternalLink className="h-3 w-3 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
