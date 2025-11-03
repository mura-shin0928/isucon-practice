# ISUCON Practice

ISUCON練習用のプロジェクトです。

## 概要

キャッシュ機能を実装したExpress.jsサーバーです。パフォーマンスの測定と最適化の練習を行います。

## 機能

- `/items` - キャッシュ付きアイテム取得エンドポイント
- `/items-no-cache` - キャッシュなし版（比較用）
- `/stats` - 統計情報取得エンドポイント
- `/cache/reset` - キャッシュリセット（POST）

## セットアップ

```bash
# Node.jsのバージョンを指定
nvm use v18.20.7

# 依存関係のインストール
npm install
```

## 実行方法

```bash
# サーバー起動
node index.js

# ベンチマーク実行
npm run bench

# 統計情報確認
npm run stats
```

## 技術スタック

- Node.js (v18.20.7)
- Express.js
- Autocannon (ベンチマークツール)

