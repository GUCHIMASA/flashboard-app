import React from 'react';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
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
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">プライバシーポリシー</h1>
          </div>
          <p className="text-muted-foreground font-medium">最終更新日: 2024年3月21日</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">1. 収集する情報</h2>
            <p>
              AI Synapse（以下「当サービス」）は、以下の情報を収集する場合があります。
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>アカウント情報:</strong> メールアドレス、氏名、プロフィール画像（Googleログイン利用時）。</li>
              <li><strong>利用データ:</strong> ブックマークした記事、追加したニュースソース。</li>
              <li><strong>技術的情報:</strong> IPアドレス、ブラウザの種類、アクセス日時、Cookieデータ。</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">2. 情報の利用目的</h2>
            <p>収集した情報は以下の目的で利用されます。</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>ユーザー認証およびアカウント管理のため。</li>
              <li>AIによるパーソナライズされた情報提供および要約機能の提供のため。</li>
              <li>サービスの改善、不具合対応、および利用状況の分析のため。</li>
              <li>広告の配信およびその成果計測のため。</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">3. Cookieおよびアクセス解析ツールの使用</h2>
            <p>
              当サービスでは、サービス向上のためGoogle Analyticsを使用しています。これにはCookieを通じて収集されるトラフィックデータが含まれますが、個人を特定する情報は含まれません。
            </p>
            <p>
              ブラウザの設定でCookieを無効にすることで、データの収集を拒否することが可能です。詳細はGoogleの規約をご確認ください。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">4. 広告の配信について</h2>
            <p>
              当サービスでは、第三者配信事業者（Google AdSenseなど）による広告を掲載する場合があります。これらの事業者は、ユーザーの過去のアクセス情報に基づいてパーソナライズされた広告を表示するため、Cookieを使用することがあります。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">5. 第三者への情報提供</h2>
            <p>
              ユーザーの同意なく個人情報を第三者に提供することはありません。ただし、法令に基づき開示が必要な場合、または当サービスの権利保護に必要な場合は除きます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black border-l-4 border-primary pl-4">6. お問い合わせ</h2>
            <p>
              プライバシーポリシーに関するお問い合わせは、アプリ内のフィードバック機能または管理者の連絡先までお願いいたします。
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
