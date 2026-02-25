
"use client";

import { useAuth } from '@/contexts/auth';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import AuthForm from './auth-form';

export default function Header() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div className="h-10" />;
  }

  return (
    <header className="flex justify-between items-center p-4">
      <h1 className="text-xl font-bold">News Aggregator</h1>
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
          </div>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Login</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Login</DialogTitle>
              </DialogHeader>
              <AuthForm />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  );
}
