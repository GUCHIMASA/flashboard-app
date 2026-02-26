
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Mail, Lock, UserPlus } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  displayName: z.string().min(2, '名前は2文字以上で入力してください').optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "おかえりなさい！", description: "ログインに成功しました。" });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        if (data.displayName) {
          await updateProfile(userCredential.user, { displayName: data.displayName });
        }
        toast({ title: "ようこそ！", description: "アカウントの作成とログインに成功しました。" });
      }
      onOpenChange(false);
      reset();
    } catch (error: any) {
      let message = "認証中にエラーが発生しました。";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = "このメールアドレスは既に登録されています。ログインをお試しください。";
          break;
        case 'auth/invalid-credential':
          message = "メールアドレスまたはパスワードが正しくありません。入力内容を確認してください。";
          break;
        case 'auth/operation-not-allowed':
          message = "現在、この認証方法は有効になっていません。管理者に連絡してください。";
          break;
        case 'auth/weak-password':
          message = "パスワードが短すぎます（6文字以上必要です）。";
          break;
        case 'auth/user-not-found':
          message = "アカウントが見つかりません。新規登録をお試しください。";
          break;
        case 'auth/wrong-password':
          message = "パスワードが正しくありません。";
          break;
        default:
          message = "エラーが発生しました。しばらく時間を置いてから再度お試しください。";
      }
      
      toast({ 
        variant: "destructive", 
        title: "認証エラー", 
        description: message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "ログイン成功", description: "Googleアカウントでログインしました。" });
      onOpenChange(false);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ 
          variant: "destructive", 
          title: "ログイン失敗", 
          description: "Googleログイン中にエラーが発生しました。" 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isLoading) {
        onOpenChange(val);
        if (!val) reset();
      }
    }}>
      <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-white/10 glass-panel">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl font-black text-center">
            {mode === 'login' ? 'おかえりなさい' : 'アカウント作成'}
          </DialogTitle>
          <DialogDescription className="text-center">
            Flashboard で次世代の情報収集を。
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => {
          setMode(v as any);
          reset();
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-full mb-6 bg-secondary/50">
            <TabsTrigger value="login" className="rounded-full">ログイン</TabsTrigger>
            <TabsTrigger value="register" className="rounded-full">新規登録</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="displayName">お名前</Label>
                <div className="relative">
                  <Input 
                    id="displayName" 
                    placeholder="山田 太郎" 
                    {...register('displayName')} 
                    className="bg-secondary/30 rounded-full pl-10"
                    disabled={isLoading}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <UserPlus className="w-4 h-4" />
                  </span>
                </div>
                {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  {...register('email')} 
                  className="bg-secondary/30 rounded-full pl-10"
                  disabled={isLoading}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </span>
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  {...register('password')} 
                  className="bg-secondary/30 rounded-full pl-10"
                  disabled={isLoading}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full rounded-full h-11 font-black uppercase tracking-widest neo-blur" disabled={isLoading}>
              {isLoading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
            </Button>
          </form>
        </Tabs>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-background px-2 text-muted-foreground">または</span></div>
        </div>

        <Button 
          variant="outline" 
          onClick={handleGoogleLogin} 
          className="w-full rounded-full h-11 border-white/10 hover:bg-white/5 font-bold gap-2"
          disabled={isLoading}
        >
          <Chrome className="w-4 h-4" /> Google でログイン
        </Button>
      </DialogContent>
    </Dialog>
  );
}
