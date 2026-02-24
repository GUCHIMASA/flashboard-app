"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export function AdCard() {
  return (
    <Card className="flex flex-col h-full border-dashed border-2 border-border/40 bg-muted/20 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden items-center justify-center p-6 text-center group transition-all hover:bg-muted/30">
      <div className="space-y-4">
        <div className="bg-muted-foreground/10 px-3 py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground inline-block">
          Sponsored
        </div>
        <div className="w-full aspect-[4/3] bg-muted/40 rounded-xl flex items-center justify-center border border-border/20 mb-4">
          <p className="text-[10px] md:text-xs text-muted-foreground font-medium px-4">
            AD UNIT<br />(Google AdSense etc.)
          </p>
        </div>
        <h4 className="text-xs md:text-sm font-bold leading-tight line-clamp-2">
          AI時代の新しい働き方をサポートするプラットフォーム
        </h4>
        <div className="flex items-center justify-center gap-2 text-primary text-[10px] font-bold">
          詳細を見る <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </Card>
  );
}
