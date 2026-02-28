"use client";

import React from 'react';
import { UserMenu } from './auth/UserMenu';
import { SidebarTrigger } from '@/components/ui/sidebar';

/**
 * 統合されたアプリケーションヘッダー
 */
export default function Header() {
  return (
    <header className="w-full border-b border-white/10 bg-background/80 backdrop-blur-xl px-4 md:px-8 h-16 flex items-center justify-between shrink-0 relative z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-10 w-10 hover:bg-white/5 rounded-full" />
        <h1 className="font-headline font-black text-xl tracking-tighter uppercase flex items-center select-none">
          FLASH<span className="text-primary">BOARD</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
}
