import React from 'react';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-4xl mx-auto p-6 md:p-12 space-y-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> トップへ戻る
        </Link>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Scale className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">利用規約</h1>
          </div>
          <p className="text-muted-foreground font-medium">最終更新日: 2024年3月21日</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">1. サービスの概要</h2>
            <p>
              AI Synapse（以下「当サービス」）は、RSSフィード等を通じてテックニュースを収集し、AIを用いて翻訳および要約を提供する情報集約型プラットフォームです。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">2. 禁止事項</h2>
            <p>ユーザーは、当サービスの利用にあたり以下の行為を行ってはなりません。</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>法令または公序良俗に違反する行為。</li>
              <li>当サービスのサーバーやネットワーク機能に過度な負荷をかける行為。</li>
              <li>自動化されたスクリプト等を用いて当サービスの内容を大量に取得する行為。</li>
              <li>他のユーザーの情報を不正に取得または利用する行為。</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">3. 免責事項</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>情報の正確性:</strong> 当サービスが提供する要約はAIによって自動生成されたものであり、内容の正確性、最新性、完全性を保証するものではありません。</li>
              <li><strong>外部サイト:</strong> 当サービスがリンクしている外部サイトの内容について、当サービスは一切の責任を負いません。</li>
              <li><strong>損害賠償:</strong> 当サービスの利用に起因してユーザーに生じた損害について、当サービスの運営者は故意または重大な過失がある場合を除き、責任を負いません。</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">4. サービスの変更・終了</h2>
            <p>
              当サービスは、事前の通知なくサービスの内容を変更、一時停止、または終了することができるものとします。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">5. 準拠法および裁判管轄</h2>
            <p>
              本規約の解釈にあたっては日本法を準拠法とします。当サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
