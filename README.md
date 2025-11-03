# ISUCON Practice

ISUCON練習用のプロジェクトです。

## 概要

MySQLを使用したExpress.jsサーバーで、キャッシュ機能によるパフォーマンス改善を検証します。

## 機能

- `/items-db` - キャッシュなし（毎回DBアクセス）
- `/items-db-cache` - TTLキャッシュ付き
- `/stats` - 統計情報取得エンドポイント

## セットアップ

### 1. 依存関係のインストール

```bash
# Node.jsのバージョンを指定
nvm use v18.20.7

# 依存関係のインストール
npm install
```

### 2. MySQLのセットアップ

#### オプションA: Dockerを使用（推奨）

**動作確認環境:**
- Docker Compose v2.40.0以上
- Docker 28.5.1以上

```bash
# Dockerとdocker-composeがインストールされている場合
docker-compose up -d

# 起動確認
docker-compose ps

# バージョン確認
docker-compose --version
```

#### オプションB: MySQLを直接インストール

```bash
# Ubuntu/Debian系の場合
sudo apt update
sudo apt install -y mysql-server

# MySQLサービスを起動
sudo systemctl start mysql
sudo systemctl enable mysql

# データベースとテーブルを作成
sudo mysql < mysql/init.sql

# または、パスワードが設定されている場合
mysql -u root -p < mysql/init.sql
```

MySQLのデフォルト設定（`index.js`内）:
- Host: 127.0.0.1
- User: root
- Password: password
- Database: isucon_practice

環境変数で変更可能:
```bash
export MYSQL_HOST=127.0.0.1
export MYSQL_USER=root
export MYSQL_PASSWORD=password
export MYSQL_DB=isucon_practice
```

## 実行方法

### サーバー起動

```bash
node index.js
```

起動すると以下のエンドポイントが利用可能:
- `http://localhost:3000/items-db` - キャッシュなし（毎回DBアクセス）
- `http://localhost:3000/items-db-cache` - TTLキャッシュ付き
- `http://localhost:3000/stats` - 統計情報

### ベンチマーク実行

```bash
# キャッシュなし版を計測
npm run bench http://localhost:3000/items-db

# キャッシュあり版を計測（デフォルト）
npm run bench http://localhost:3000/items-db-cache

# カスタム設定（接続数、継続時間）
npm run bench http://localhost:3000/items-db-cache -c 20 -d 30
```

### 統計情報確認

```bash
npm run stats
```

## 技術スタック

- Node.js (v18.20.7)
- Express.js
- MySQL 8.0
- mysql2 (Node.js MySQL driver)
- Autocannon (ベンチマークツール)

## ログ

ベンチマーク結果は `logs/YYYY-MM-DD.md` に記録されます。
