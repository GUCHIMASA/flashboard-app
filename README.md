Flashboard | インテリジェントAIダッシュボード

AI業界の動きを「5秒で俯瞰」するための、AI要約ニュースダッシュボード。

🚀 概要

Flashboard（フラッシュボード） は、複数のAI関連RSSフィードから最新ニュースを収集し、生成AIによって以下の4要素に圧縮要約して一覧表示するWebアプリです。

要約フォーマット：FACE

F（Flash）：見出し（超短文）

A（Act）：何が起きたか

C（Context）：なぜ重要か

E（Effect）：どんな影響を生むか

👉 ユーザーはページを開くだけで、その日のAI業界の動きを一瞬で把握できます。

✍️ FACE要約生成ルール（重要定義）

本アプリにおける要約は、以下の厳格な編集ルールに基づき生成される。

1. Flash（旧: translatedTitle）

読者が次の一行を読みたくなるキャッチーな日本語タイトル

固有名詞・数字を優先的に含める

背景や意味は含めず、事実のみを尖らせる

25文字以内

2. Act（何が起きたか）

固有名詞・数字・日付のみで構成

背景・理由・影響は書かない

「〜が〜した／発表した／リリースした」形式

2文以内、約60文字

3. Context（なぜ重要か）

出来事が属する業界トレンドのみを記述

Actの内容は繰り返さない

「〜という流れの中で」「〜が課題だったが」形式

2文以内、約60文字

4. Effect（どんな影響を生むか）

主語を必ず明示（開発者・企業・個人など）

抽象表現は禁止（例：便利になる、進化する）

自明な結論は禁止

2文以内、約60文字

5. Importance（重要度）

3：業界全体に影響

2：特定分野に影響

1：参考情報レベル

6. Tags（タグ付け）

固定リストから1〜4個選択（自由生成禁止）

【内容系】新モデル / ツール / 研究・論文 / ビジネス / 規制・政策 / セキュリティ【企業系】OpenAI / Anthropic / Google / Meta / Microsoft / その他企業【動き系】新リリース / 資金調達 / 提携 / 障害

※企業系タグは該当企業が直接関与している場合のみ付与

🎯 コンセプト

情報ではなく「解釈と影響」を圧縮して届ける

単なるニュースアグリゲーションではなく、意思決定に使える情報レイヤーを提供することを目的としています。

💰 マネタイズ方針（初期）

ディスプレイ広告

将来的には：

メルマガ配信

有料レポート

職種別AI影響分析

⚙️ システム構成

フロントエンド

Next.js 15

React 19

Tailwind CSS

shadcn/ui

バックエンド

Firebase

Firestore（データ保存）

Auth（将来拡張）

App Hosting

AIエンジン

Google Genkit

Gemini 2.5 Flash Lite

データ取得

rss-parser

🔄 データ更新フロー

トリガーは「自動（Cron）」または「管理者の手動同期」のいずれか。

RSSフィードを取得

記事内容を抽出

Geminiで日本語要約（FACE形式）

Firestoreへ保存

フロントに一覧表示

⏰ 自動同期（Cron）設定

① 環境変数

Firebase App Hosting にて以下を設定：

CRON_SECRET=任意のランダム文字列
GEMINI_API_KEY=Google AI Studio で発行した API キー（記事要約に必須）
ADMIN_EMAIL=管理者のメールアドレス（任意・管理者機能・手動同期ボタン表示に使用）

② Cloud Scheduler設定

名前：flashboard-sync

頻度：0 */3 * * *（3時間ごと）

タイムゾーン：JST

ターゲット：HTTP

URL：
https://flashboard.jp/api/cron/sync?secret=CRON_SECRET

HTTPメソッド：GET

③ 動作確認

管理者アカウントでサービスにログインし、Cloud Scheduler から「今すぐ同期」し、ダッシュボードに記事が追加されることを確認

🛠 管理者による手動同期（重要機能）

管理者がログインしている場合のみ、サイドバー下部に 「今すぐ同期」 ボタンを表示

ボタン押下で /api/cron/sync を即時実行し、RSS取得〜要約〜保存までの一連の処理を開始

Cronとは同一の処理系を利用し、二重実装を避ける

運用上の用途：

速報性の高いニュースを即時反映

Cron失敗時のリカバリ

デバッグ・検証

※ UIは管理者認証（Firebase Auth）に紐づけて表示制御する

🔐 管理者判定の実装方針

管理者ユーザーは 環境変数 ADMIN_EMAIL によって判定する

フロント／バックエンド双方で同一の判定ロジックを使用する

例：

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (user?.email === ADMIN_EMAIL) {
  // 管理者機能を有効化
}

※ 個人メールアドレスはリポジトリにハードコードしない（セキュリティおよび運用上の理由）

🧪 ローカル開発

npm install
npm run dev

**同期の稼働テスト（Cron と同じ処理をローカルで実行）**

```bash
npm run test:sync
```

`.env.local` に `NEXT_PUBLIC_FIREBASE_*` と `GEMINI_API_KEY` を設定した状態で実行すると、RSS 取得〜要約〜Firestore 保存まで一通り動きます。結果（追加件数・更新件数・RSS エラー・AI エラー）がターミナルに表示されます。

ローカルで Firestore へ書き込むには、Admin SDK の認証が必要です（Firestore ルールで弾かれないため）。

- `FIREBASE_SERVICE_ACCOUNT_KEY`（サービスアカウントJSONを文字列で入れる）または
- `GOOGLE_APPLICATION_CREDENTIALS`（サービスアカウントJSONファイルへのパス）

を設定してください。

また、Gemini 側で `403 Forbidden`（`Generative Language API has not been used...`）が出る場合は、エラー文に出てくるリンクから対象プロジェクトで `Generative Language API` を有効化し、数分待ってから再実行してください。

🧠 設計思想（重要）

このプロジェクトは以下を最優先とする：

手間の最小化

自動化

変更に強い構造

将来の拡張余地

⚠️ 開発ルール（必読）

① 壊れたらまず Git に戻る

git log --oneline src/該当ファイル.ts
git checkout <ハッシュ> -- src/該当ファイル.ts

② UIを勝手に変更しない

デザイン・文言・レイアウトの変更は必ず事前確認

③ 変更は1つずつ行う

一度に複数変更しない

毎回オーナー確認を取る

④ 変更内容は必ず報告

変更ファイル：src/xxx.ts
変更内容：○○を修正
理由：○○のため

⑤ 新規ライブラリ導入は禁止（原則）

必要な場合は事前承認を必須とする

🧩 新機能追加の手順

影響範囲を分析

オーナーに事前報告

最小変更で実装

実装内容を報告

🗺️ 今後のロードマップ

Phase1

重要度スコアリング

職種別タグ付け

Phase2

メルマガ配信

LINE通知

保存機能

Phase3

パーソナライズ

Phase4

AI導入支援SaaS化

📌 プロジェクトの役割

Flashboardは単体サービスではなく、

👉 AI時代の情報ハブ

として設計されている。

✍️ Author

Masahiro Kawaguchi

