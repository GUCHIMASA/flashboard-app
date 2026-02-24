"use client";

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ExternalLink, BrainCircuit, Share2, Bookmark, Loader2, BookmarkCheck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/app/lib/types';
import { summarizeAggregatedArticleContent } from '@/ai/flows/summarize-aggregated-article-content-flow';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface FeedCardProps {
  article: Article;
}

export function FeedCard({ article }: FeedCardProps) {
  const { user } = useUser();
  const db = useFirestore();
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
    } catch (error) {
      console.error("要約に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = () => {
    if (!db || !user) return;
    
    addDoc(collection(db, 'users', user.uid, 'bookmarks'), {
      articleId: article.id,
      title: article.title,
      url: article.link,
      sourceName: article.sourceName,
      bookmarkedAt: serverTimestamp(),
    });
    setIsBookmarked(true);
  };

  const categoryLabels: Record<string, string> = {
    'Reliable': '信頼済み',
    'Discovery': '発見',
    'Custom': 'カスタム'
  };

  return (
    <Card className="group border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg bg-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-accent">{article.sourceName}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}</span>
          </div>
          <h3 className="font-headline text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
        </div>
        <Badge variant="outline" className="bg-secondary/50 text-primary-foreground border-transparent whitespace-nowrap ml-2">
          {categoryLabels[article.category] || article.category}
        </Badge>
      </CardHeader>
      
      <CardContent className="pt-2">
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
          {article.content}
        </p>

        {summary ? (
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mt-2">
            <div className="flex items-center gap-2 mb-2 text-accent">
              <BrainCircuit className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">AI 要約</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed italic">
              {summary}
            </p>
          </div>
        ) : (
          <Button 
            onClick={handleSummarize} 
            disabled={loading}
            variant="outline" 
            size="sm" 
            className="w-full mt-2 border-dashed bg-secondary/30 hover:bg-accent/10 border-accent/30 text-accent group-hover:bg-accent group-hover:text-white transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <BrainCircuit className="w-4 h-4 mr-2" />
            )}
            AIで要約する
          </Button>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/50 py-3 bg-muted/5 rounded-b-lg">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8", isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary")}
            onClick={handleBookmark}
            disabled={!user || isBookmarked}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-accent hover:text-accent font-semibold flex items-center gap-1">
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            ソースを読む <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
