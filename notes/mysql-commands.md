# MySQL コマンドリファレンス

ISUCON学習でよく使うMySQLコマンドのまとめです。

## 接続方法

### Docker経由で接続

```bash
# インタラクティブモードで接続
docker exec -it isucon-practice-mysql mysql -u root -ppassword isucon_practice

# ワンライナーでコマンド実行
docker exec -it isucon-practice-mysql mysql -u root -ppassword isucon_practice -e "SHOW TABLES;"
```

### 接続情報
- Host: `127.0.0.1` または `localhost`
- Port: `3306`
- User: `root`
- Password: `password`
- Database: `isucon_practice`

---

## 基本コマンド

### データベース操作

```sql
-- データベース一覧を表示
SHOW DATABASES;

-- 現在のデータベースを確認
SELECT DATABASE();

-- データベースを選択
USE isucon_practice;
```

### テーブル操作

```sql
-- テーブル一覧を表示
SHOW TABLES;

-- テーブル構造を確認
DESCRIBE items;
-- または
DESC items;

-- テーブル作成SQLを表示
SHOW CREATE TABLE items;
```

### データ操作

```sql
-- 全件取得
SELECT * FROM items;

-- 特定カラムのみ取得
SELECT id, name, price FROM items;

-- 件数確認
SELECT COUNT(*) FROM items;

-- 条件付き検索（例）
SELECT * FROM items WHERE category = 'Electronics';
SELECT * FROM items WHERE price > 5000;
```

---

## EXPLAIN（実行計画確認）

### 基本的な使い方

```sql
-- 実行計画を確認
EXPLAIN SELECT id, name, description, price, category FROM items;

-- 縦表示（見やすい）
EXPLAIN SELECT id, name, description, price, category FROM items\G
```

### 重要なフィールド

- **type**: アクセスタイプ（`ALL` = フルスキャン、`ref` = インデックス使用など）
- **key**: 実際に使用されるインデックス（`NULL` = インデックス未使用）
- **possible_keys**: 使用可能なインデックス
- **rows**: スキャンする行数の見積もり

---

## インデックス操作

### インデックス一覧を確認

```sql
-- テーブルのインデックスを確認
SHOW INDEX FROM items;
```

### インデックス作成（参考）

```sql
-- 単一カラムのインデックス
CREATE INDEX idx_category ON items(category);

-- 複合インデックス
CREATE INDEX idx_category_price ON items(category, price);

-- インデックス削除
DROP INDEX idx_category ON items;
```

---

## その他の便利なコマンド

### テーブル情報

```sql
-- テーブルの行数を確認
SELECT COUNT(*) FROM items;

-- テーブルのサイズを確認
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'isucon_practice';
```

### クエリの実行時間を計測

```sql
-- 実行時間を表示
SET profiling = 1;
SELECT * FROM items;
SHOW PROFILES;
```

### 接続情報の確認

```sql
-- 現在の接続情報
SELECT USER(), DATABASE();

-- 接続中のスレッドを確認
SHOW PROCESSLIST;
```

---

## よく使うワンライナー

```bash
# テーブル一覧を確認
docker exec -it isucon-practice-mysql mysql -u root -ppassword isucon_practice -e "SHOW TABLES;"

# データ件数を確認
docker exec -it isucon-practice-mysql mysql -u root -ppassword isucon_practice -e "SELECT COUNT(*) FROM items;"

# EXPLAINを実行
docker exec -it isucon-practice-mysql mysql -u root -ppassword isucon_practice -e "EXPLAIN SELECT * FROM items\G"

# SQLファイルを実行
docker exec -i isucon-practice-mysql mysql -u root -ppassword isucon_practice < mysql/init.sql
```

---

## トラブルシューティング

### 接続できない場合

```bash
# コンテナが起動しているか確認
docker-compose ps

# MySQLのログを確認
docker-compose logs mysql

# コンテナ内でMySQLプロセスを確認
docker exec -it isucon-practice-mysql ps aux | grep mysql
```

### データベースをリセットしたい場合

```bash
# コンテナを削除して再起動（データも削除される）
docker-compose down -v
docker-compose up -d
```

---

## 参考

- [MySQL公式ドキュメント](https://dev.mysql.com/doc/)
- [EXPLAIN出力の説明](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html)

