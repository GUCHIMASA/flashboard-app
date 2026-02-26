
"use client";

import React from 'react';
import { UserMenu } from './auth/UserMenu';
import { ThemeToggle } from './dashboard/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';

/**
 * 統合されたアプリケーションヘッダー
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/60 backdrop-blur-md px-4 md:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="font-headline font-black text-xl tracking-tighter hidden md:block uppercase">
          FLASH<span className="text-primary">BOARD</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
