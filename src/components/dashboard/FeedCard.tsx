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
    'Reliable': '信頼済み',
    'Discovery': '発見',
    'Custom': 'カスタム'
  };

  return (
    <Card className="group flex flex-col h-full border-border/40 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-card rounded-[2rem] overflow-hidden">
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="bg-muted/30 text-[10px] uppercase tracking-widest font-bold border-transparent px-3 py-1 rounded-full">
            {categoryLabels[article.category] || article.category}
          </Badge>
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary tracking-tight">{article.sourceName}</span>
          </div>
          <h3 className="font-headline text-xl font-bold leading-[1.3] group-hover:text-primary transition-colors line-clamp-2 tracking-tight">
            {article.title}
          </h3>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 py-2 flex-grow">
        <p className="text-muted-foreground/80 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
          {article.content}
        </p>

        {summary ? (
          <div className="bg-primary/5 border border-primary/10 rounded-[1.5rem] p-5 mt-2 animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden group/summary">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <BrainCircuit className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-3 text-primary relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">AI Intelligence</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed font-medium relative z-10">
              {summary}
            </p>
          </div>
        ) : (
          <Button 
            onClick={handleSummarize} 
            disabled={loading}
            variant="ghost" 
            className="w-full mt-2 h-12 rounded-xl bg-muted/20 hover:bg-primary hover:text-white border border-dashed border-primary/20 transition-all duration-300 font-bold text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                解析中...
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4 mr-2" />
                AI要約を生成
              </>
            )}
          </Button>
        )}
      </CardContent>

      <CardFooter className="px-6 py-6 flex items-center justify-between border-t border-border/20 mt-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted transition-colors">
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-9 w-9 rounded-full transition-all", isBookmarked ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-muted")}
            onClick={handleBookmark}
            disabled={isBookmarked}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs font-bold hover:text-primary p-0 h-auto">
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
            記事を読む <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
