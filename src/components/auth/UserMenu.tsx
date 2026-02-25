
'use client';

import React, { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, User, Settings, LogIn } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useToast } from '@/hooks/use-toast';

export function UserMenu() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "ログアウトしました", description: "またのご利用をお待ちしております。" });
    } catch (error) {
      toast({ variant: "destructive", title: "エラー", description: "ログアウトに失敗しました。" });
    }
  };

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-secondary animate-pulse" />;
  }

  if (!user) {
    return (
      <>
        <Button 
          onClick={() => setIsAuthOpen(true)}
          className="rounded-full px-6 font-black h-10 gap-2 neo-blur"
        >
          <LogIn className="w-4 h-4" /> ログイン
        </Button>
        <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border-2 border-primary/20 hover:border-primary/50 transition-all">
          <Avatar className="h-full w-full">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-black">
              {user.displayName?.[0] || user.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass-panel border-white/10 rounded-[1.5rem]" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-black leading-none">{user.displayName || 'ゲストユーザー'}</p>
            <p className="text-[10px] leading-none text-muted-foreground truncate uppercase tracking-tighter">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
          <User className="w-4 h-4" /> プロフィール
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
          <Settings className="w-4 h-4" /> 設定
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="rounded-lg gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
