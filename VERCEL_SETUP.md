# Vercelデプロイ完了後の設定手順

## 🗄️ データベース設定 (Vercel Postgres)

### 1. Vercel Postgresの有効化
1. Vercelダッシュボードでプロジェクトを選択
2. 「Storage」タブをクリック
3. 「Create Database」→「Postgres」を選択
4. データベース名: `stock-chart-tool-db`
5. 「Create」をクリック

### 2. 環境変数の自動設定
Vercel Postgresを作成すると、以下の環境変数が自動設定されます：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` 
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 3. データベーススキーマの適用
Vercelダッシュボードの「Functions」タブで：
```bash
npx prisma db push
```

### 4. サンプルデータの投入
```bash
npm run seed:sample
```

## 🔧 追加設定 (オプション)

### J-Quants API連携
「Settings」→「Environment Variables」で追加：
```
JQUANTS_MAIL_ADDRESS=your-email@example.com
JQUANTS_PASSWORD=your-password
```

### キャッシュ再検証
```
REVALIDATE_SECRET=your-secret-key
```

## 🚀 デプロイ後の確認項目

### ✅ 基本機能
- [ ] アプリケーションの起動
- [ ] チャート表示
- [ ] 銘柄検索
- [ ] 自動巡回機能

### ✅ API機能
- [ ] `/api/list` - 銘柄一覧
- [ ] `/api/stock/[code]` - 株価データ
- [ ] `/api/marks` - マーク機能
- [ ] `/api/history` - 履歴機能

### ✅ データベース
- [ ] Prisma接続
- [ ] サンプルデータ表示
- [ ] CRUD操作

## 🔍 トラブルシューティング

### データベース接続エラー
```
Error: Environment variable not found: POSTGRES_PRISMA_URL
```
→ Vercel Postgresが正しく設定されているか確認

### ビルドエラー
```
Module not found: Can't resolve '@/lib/...'
```
→ TypeScriptパス設定を確認

### API エラー
```
500 Internal Server Error
```
→ Vercelの「Functions」ログを確認

## 📊 パフォーマンス最適化

### 1. Edge Functions (オプション)
軽量なAPIは Edge Runtime に移行可能

### 2. ISR (Incremental Static Regeneration)
```typescript
export const revalidate = 300; // 5分間キャッシュ
```

### 3. CDN最適化
```typescript
// next.config.js
const nextConfig = {
  images: {
    domains: ['your-cdn-domain.com'],
  },
};
```

## 🎯 完了確認

全ての設定が完了したら：
1. アプリケーションURL にアクセス
2. 全機能の動作確認
3. パフォーマンステスト
4. エラーログの確認

**成功時の表示**: 日本株チャート巡回ツール v2.0 が完全に動作
