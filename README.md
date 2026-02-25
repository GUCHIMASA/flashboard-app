
# AI Synapse | インテリジェントAIダッシュボード

AIを活用した情報の集約と要約を実現する次世代ダッシュボードへようこそ。

## 1. アプリ概要
「AI Synapse」は、複数のRSSフィードから最新のテックニュースやAI動向を自動的に収集し、AI（Google Gemini）を用いてタイトルを日本語へ翻訳、内容を3つの要点に要約して表示するインテリジェントな情報アグリゲーターです。

## 2. 主要機能の仕様

### 2.1 AI 要約（Quick Insight）
- **動作**: 英語の記事タイトルを自然な日本語に翻訳し、本文から重要なポイントを3つ抽出して箇条書き（・）で要約します。
- **エンジン**: Google Genkit + Gemini 2.5 Flash Lite。
- **仕様**: `summarizeAggregatedArticleContent` フローにより、翻訳と要約を一括処理。AIが失敗した場合は保存をスキップし、次回の同期で再試行します。

### 2.2 リアルタイム同期（Sync RSS）
- **RSS取得**: `rss-parser` を使用。
- **画像抽出**: `enclosure`、`media:content`、本文中の `<img>` タグから抽出。
- **同期ロジック**: 既に日本語化されている記事はスキップ。新規または未処理の記事のみAI処理。
- **レート制限**: 記事1件ごとに2秒の待機時間を設定。

### 2.3 管理者権限（Admin Controls）
- **制限**: 同期の実行は、特定のメールアドレスを持つ管理者のみ可能です。
- **UI**: 管理者としてログインしている場合のみ、更新ボタンが表示されます。

### 2.4 定期自動同期（Cloud Scheduler）
- **動作**: Firebase Cloud Schedulerにより、3時間ごとに自動で最新記事を取得・翻訳します。
- **スケジュール**: `0 */3 * * *` (3時間おき)
- **エンドポイント**: `/api/cron/sync?secret=YOUR_CRON_SECRET`
- **セキュリティ**: 環境変数 `CRON_SECRET` を使用したトークン認証。

## 3. 開発スタック
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **AI Engine**: Google Genkit / Gemini 2.5 Flash Lite
- **Backend**: Firebase (Firestore, Auth, App Hosting)

## 4. セットアップ
`.env` ファイルに以下の設定が必要です。

```env
# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# Google AI
GOOGLE_GENAI_API_KEY=...
# 自動同期用シークレット
CRON_SECRET=your_secure_random_string
```

### 自動同期（Cron）の設定手順
1. Google Cloud Console または Firebase Console から **Cloud Scheduler** を開きます。
2. 新しいジョブを作成し、頻度を `0 */3 * * *` に設定します。
3. ターゲットを `HTTP` とし、URLに `https://your-app-url.com/api/cron/sync?secret=あなたのCRON_SECRET` を入力します。
4. HTTPメソッドを `GET` に設定して保存します。
