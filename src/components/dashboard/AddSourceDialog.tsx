"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FeedSource } from '@/app/lib/types';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (source: Omit<FeedSource, 'id'>) => void;
}

export function AddSourceDialog({ open, onOpenChange, onAdd }: AddSourceDialogProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && url) {
      onAdd({ name, url, category: 'Custom' });
      setName('');
      setUrl('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">ニュースソースを追加</DialogTitle>
          <DialogDescription>
            追跡したいAIニュースサイトやRSSフィードの詳細を入力してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">ソース名</Label>
            <Input 
              id="name" 
              placeholder="例: Stability AI ブログ" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/30"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-semibold">RSSフィードURL</Label>
            <Input 
              id="url" 
              placeholder="https://example.com/feed.xml" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-muted/30"
              type="url"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">追加する</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
