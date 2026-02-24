"use client";

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ExternalLink, BrainCircuit, Share2, Bookmark, Loader2, BookmarkCheck, ArrowUpRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/app/lib/types';
import { summarizeAggregatedArticleContent } from '@/ai/flows/summarize-aggregated-article-content-flow';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface FeedCardProps {
  article: Article;
}

export function FeedCard({ article }: FeedCardProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [summary, setSummary] = useState<string | null>(article.summary || null);
  const [loading, setLoading] = useState(!article.summary);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // コンポーネントマウント時に要約がない場合は自動生成
  useEffect(() => {
    let isMounted = true;
    
    const autoSummarize = async () => {
      if (summary || !loading) return;
      
      try {
        const result = await summarizeAggregatedArticleContent({
          title: article.title,
          content: article.content
        });
        if (isMounted) {
          setSummary(result.summary);
          setLoading(false);
        }
      } catch (error) {
        console.error("自動要約に失敗しました:", error);
        if (isMounted) setLoading(false);
      }
    };

    autoSummarize();
    
    return () => {
      isMounted = false;
    };
  }, [article.title, article.content, summary, loading]);

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
      summary: summary,
      url: article.link,
      sourceName: article.sourceName,
      imageUrl: article.imageUrl || '',
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
    <Card className="group flex flex-col h-full border-border/40 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] bg-card rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
      <CardHeader className="p-3 md:p-6 pb-1 md:pb-2">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <Badge variant="outline" className="bg-muted/30 text-[8px] md:text-[10px] uppercase tracking-wider md:tracking-widest font-bold border-transparent px-2 py-0.5 md:px-3 md:py-1 rounded-full shrink-0">
            {categoryLabels[article.category] || article.category}
          </Badge>
          <span className="text-[8px] md:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate ml-1">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
        <div className="space-y-1 md:space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] md:text-xs font-bold text-primary tracking-tight truncate">{article.sourceName}</span>
          </div>
          <h3 className="font-headline text-sm md:text-xl font-bold leading-[1.3] group-hover:text-primary transition-colors line-clamp-2 tracking-tight">
            {article.title}
          </h3>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 md:px-6 py-1 md:py-2 flex-grow">
        {/* AI要約セクション - 自動表示 */}
        <div className="bg-primary/5 border border-primary/10 rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-5 mt-1 md:mt-2 relative overflow-hidden group/summary min-h-[100px] flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-2 opacity-10 md:opacity-20 pointer-events-none">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </div>
          
          <div className="flex items-center gap-2 mb-2 text-primary relative z-10">
            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em]">AI Insight</span>
            {loading && <Loader2 className="w-2.5 h-2.5 md:w-3 md:h-3 animate-spin" />}
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full bg-primary/10" />
              <Skeleton className="h-3 w-[90%] bg-primary/10" />
              <Skeleton className="h-3 w-[80%] bg-primary/10" />
            </div>
          ) : summary ? (
            <div className="text-[11px] md:text-sm text-foreground/90 leading-relaxed font-medium relative z-10 animate-in fade-in duration-700 whitespace-pre-line">
              {summary}
            </div>
          ) : (
            <p className="text-[10px] md:text-xs text-muted-foreground italic">要約を生成できませんでした</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-3 md:px-6 py-3 md:py-6 flex items-center justify-between border-t border-border/10 md:border-border/20 mt-2 md:mt-4">
        <div className="flex items-center gap-0.5 md:gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9 rounded-full hover:bg-muted transition-colors">
            <Share2 className="h-3.5 w-3.5 md:h-4 md:h-4 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-7 w-7 md:h-9 md:w-9 rounded-full transition-all", isBookmarked ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-muted")}
            onClick={handleBookmark}
            disabled={isBookmarked}
          >
            {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 md:h-4 md:h-4" /> : <Bookmark className="h-3.5 w-3.5 md:h-4 md:h-4" />}
          </Button>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-[10px] md:text-xs font-bold hover:text-primary p-0 h-auto">
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 md:gap-1.5">
            原文を読む <ArrowUpRight className="h-3 w-3 md:h-3.5 md:h-3.5" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
