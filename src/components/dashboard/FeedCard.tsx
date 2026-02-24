
"use client";

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ExternalLink, BrainCircuit, Share2, Bookmark, Loader2, BookmarkCheck, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/app/lib/types';
import { summarizeAggregatedArticleContent } from '@/ai/flows/summarize-aggregated-article-content-flow';
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
  const [summary, setSummary] = useState<string | null>(article.summary || null);
  const [loading, setLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleSummarize = async () => {
    if (summary) return;
    setLoading(true);
    try {
      const result = await summarizeAggregatedArticleContent({
        title: article.title,
        content: article.content
      });
      setSummary(result.summary);
      toast({
        title: "要約が完了しました",
        description: "AIによる要約が生成されました。",
      });
    } catch (error) {
      console.error("要約に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <p className="text-muted-foreground/80 text-[10px] md:text-sm leading-relaxed mb-3 md:mb-6 line-clamp-2 md:line-clamp-3 font-medium">
          {article.content}
        </p>

        {summary ? (
          <div className="bg-primary/5 border border-primary/10 rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-5 mt-1 md:mt-2 animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden group/summary">
            <div className="absolute top-0 right-0 p-2 opacity-10 md:opacity-20">
              <BrainCircuit className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-1.5 md:mb-3 text-primary relative z-10">
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em]">AI Intelligence</span>
            </div>
            <p className="text-[11px] md:text-sm text-foreground/90 leading-relaxed font-medium relative z-10 line-clamp-4 md:line-clamp-none">
              {summary}
            </p>
          </div>
        ) : (
          <Button 
            onClick={handleSummarize} 
            disabled={loading}
            variant="ghost" 
            className="w-full mt-1 md:mt-2 h-9 md:h-12 rounded-xl bg-muted/20 hover:bg-primary hover:text-white border border-dashed border-primary/20 transition-all duration-300 font-bold text-[10px] md:text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-1.5 md:mr-2" />
                解析中...
              </>
            ) : (
              <>
                <BrainCircuit className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                要約生成
              </>
            )}
          </Button>
        )}
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
            <span className="hidden xs:inline">記事を</span>読む <ArrowUpRight className="h-3 w-3 md:h-3.5 md:h-3.5" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
