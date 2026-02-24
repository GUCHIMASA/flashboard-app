
"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export function AdCard() {
  return (
    <Card className="flex flex-col h-full border-dashed border-2 border-border/40 bg-muted/20 rounded-[1rem] md:rounded-[2rem] overflow-hidden items-center justify-center p-4 md:p-6 text-center group transition-all hover:bg-muted/30">
      <div className="space-y-2 md:space-y-4">
        <div className="bg-muted-foreground/10 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[7px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground inline-block">
          Sponsored
        </div>
        <div className="w-full aspect-[4/3] bg-muted/40 rounded-lg flex items-center justify-center border border-border/20 mb-2 md:mb-4">
          <p className="text-[9px] md:text-xs text-muted-foreground font-medium px-2">
            AD UNIT<br />(Google AdSense)
          </p>
        </div>
        <h4 className="text-[10px] md:text-sm font-bold leading-tight line-clamp-2">
          AI時代の新しい働き方をサポート
        </h4>
        <div className="flex items-center justify-center gap-1 text-primary text-[9px] md:text-[10px] font-bold">
          詳細 <ExternalLink className="w-2.5 h-2.5 md:w-3 md:h-3" />
        </div>
      </div>
    </Card>
  );
}
