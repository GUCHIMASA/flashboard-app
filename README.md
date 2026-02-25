
# AI Synapse | インテリジェントAIダッシュボード

AIを活用した情報の集約と要約を実現する次世代ダッシュボードへようこそ。

## 主な機能

- **インタラクティブ・フィード**: ガラス質感（Glassmorphism）とネオンアクセントを採用した没入型デザイン。
- **AI要約（Quick Insight）**: Gemini API（Genkit）を使用し、各記事を3つの要点に自動要約。
- **リアルタイム同期**: 「INITIALIZE SYNC」ボタンで、登録された全RSSソースから最新記事を取得。
- **ハイブリッド・テーマ**: システム設定、ライトモード、ダークモードに完全対応。
- **カスタムソース**: 自分の好きなRSSフィードを追加してパーソナライズ可能。

## 設定と再起動について

### 1. 環境変数の設定
`.env` ファイルに以下の項目を正しく設定してください：
- `NEXT_PUBLIC_FIREBASE_...`: Firebaseコンソールから取得したプロジェクト設定。
- `GOOGLE_GENAI_API_KEY`: Google AI Studioから取得したGemini用APIキー。

### 2. 再起動の方法
- このエディタでコードの「変更を適用」すると、自動的に再ビルドが行われます。
- `.env` を書き換えた後は、このREADMEなどのファイルを1文字修正して適用するだけで、最新の環境変数がシステムに読み込まれます。
- プレビューが更新されない場合は、プレビュー画面をリロードしてください。

## 開発スタック
- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **UI Components**: ShadCN UI, Lucide Icons
- **AI Engine**: Google Genkit, Gemini 1.5 Flash
- **Backend**: Firebase (Firestore, Authentication)
