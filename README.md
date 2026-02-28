
# Flashboard | インテリジェントAIダッシュボード

AIを活用した情報の集約と要約を実現する次世代ダッシュボード。

## 1. アプリ概要
「Flashboard（フラッシュボード）」は、複数のRSSフィードから最新のテックニュースを収集し、AI（Google Gemini）を用いて日本語翻訳、3つの要点に要約して表示する情報アグリゲーターです。

## 2. 自動同期（Cron）のセットアップ手順
自動同期を機能させるには、以下のステップが必要です。

### ステップ1: 環境変数の設定
Firebase App Hosting（または使用しているホスティングサービス）の管理画面で、以下の環境変数を追加してください。
- `CRON_SECRET`: 任意のランダムな文字列（例: `abc-123-xyz`）

### ステップ2: Cloud Scheduler の作成
1. [Google Cloud Console](https://console.cloud.google.com/) の **Cloud Scheduler** ページに移動します。
2. 「ジョブを作成」をクリックします。
3. **名前**: `flashboard-sync`
4. **頻度**: `0 */3 * * *` （3時間ごとに実行）
5. **タイムゾーン**: 日本標準時 (JST)
6. **ターゲットタイプ**: `HTTP`
7. **URL**: `https://flashboard.jp/api/cron/sync?secret=ステップ1で設定した文字列`
8. **HTTPメソッド**: `GET`
9. 「作成」をクリックします。

### ステップ3: 動作確認
Cloud Schedulerの一覧から「今すぐ実行」をクリックし、アプリのダッシュボードに新しい記事が追加されるか確認してください。

## 3. 開発スタック
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **AI Engine**: Google Genkit / Gemini 2.5 Flash Lite
- **Backend**: Firebase (Firestore, Auth, App Hosting)
