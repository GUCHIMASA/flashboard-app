
# AI Synapse | インテリジェントAIダッシュボード

AIを活用した情報の集約と要約を実現する次世代ダッシュボードへようこそ。

## 1. アプリ概要
「AI Synapse」は、複数のRSSフィードから最新のテックニュースやAI動向を自動的に収集し、AI（Google Gemini）を用いてタイトルを日本語へ翻訳、内容を3つの要点に要約して表示するインテリジェントな情報アグリゲーターです。

## 2. 主要機能の仕様

### 2.1 AI 要約（Quick Insight）
- **動作**: 英語の記事タイトルを自然な日本語に翻訳し、本文から最も重要な3つのポイントを抽出して箇条書き（・）で要約します。
- **エンジン**: Google Genkit + Gemini 2.5 Flash Lite。
- **仕様**: `summarizeAggregatedArticleContent` フローにより、翻訳と要約を一括処理。AIが失敗した場合は、データベースの整合性を守るため保存をスキップし、次回の同期で再試行します。

### 2.2 リアルタイム同期（Sync RSS）
- **RSS取得**: `rss-parser` を使用し、登録されたソースから最新記事を取得。
- **画像抽出**: `enclosure` タグ、`media:content`、本文中の `<img>` タグから最適な画像を自動抽出。見つからない場合は独自のプレースホルダー画像を生成。
- **同期ロジック**: 既に日本語化されている記事はスキップし、新規または未処理の記事のみをAIで処理します。
- **レート制限**: APIの負荷を抑えるため、記事1件ごとに2秒の待機時間を設けています。

### 2.3 管理者権限（Admin Controls）
- **制限**: 記事の同期（INITIALIZE SYNC）は、特定のメールアドレスを持つ管理者のみが実行可能です。
- **UI**: 管理者としてログインしている場合のみ、右上に更新ボタンが表示されます。
- **サーバー側検証**: Genkitフロー内でも実行ユーザーのメールアドレスを検証し、不正なリクエストをブロックします。

### 2.4 インタラクティブUI
- **デザイン**: ガラス質感（Glassmorphism）とネオンアクセントを採用。
- **テーマ**: `next-themes` によるライト/ダーク/システム設定への対応。
- **レスポンシブ**: モバイル対応のサイドバー（ShadCN Sidebar）を搭載。

## 3. 開発スタック
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **UI Components**: ShadCN UI, Lucide Icons
- **AI Engine**: Google Genkit (@genkit-ai/google-genai) / Gemini 2.5 Flash Lite
- **Backend**: Firebase (Firestore, Authentication)

## 4. セットアップと環境変数
`.env` ファイルに以下の設定が必要です。

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Google AI (Gemini)
GOOGLE_GENAI_API_KEY=...
```

## 5. 開発者向けの注意点
- **環境変数の反映**: `.env` を変更した後は、Next.jsの再ビルド（またはファイルの微修正によるホットリロード）が必要です。
- **Firestoreルール**: `firestore.rules` で記事の読み取りは誰でも可能ですが、書き込みは認証済みユーザー、特に個別のユーザーデータは本人にのみ制限されています。
