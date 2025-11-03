# 🔧 環境構築・躓きポイント

ISUCON学習中に遭遇した環境構築やトラブルシューティングの記録です。

---

## 2025-11-03: MySQL環境構築

### 躓きポイント1: MySQLコマンドが見つからない

**エラー:**
```bash
mysql: command not found
```

**原因:**
- MySQLがシステムにインストールされていない

**解決方法:**
- Docker Composeを使用してMySQLを起動
- `docker-compose.yml` を作成し、`docker-compose up -d` で起動

**学び:**
- MySQLのセットアップ方法には2通りある
  1. Dockerを使用（推奨、簡単）
  2. 直接インストール（`sudo apt install mysql-server`）
- 今回はDockerを使用したため、システムにMySQLを直接インストールする必要はなかった

---

### 躓きポイント2: Dockerの権限エラー

**エラー:**
```
permission denied while trying to connect to the Docker daemon socket
```

**原因:**
- ユーザーがdockerグループに所属していない
- Dockerデーモンへのアクセス権限がない

**解決方法:**
- `sudo docker-compose up -d` で一時的に実行
- または、ユーザーをdockerグループに追加: `sudo usermod -aG docker $USER`（要再ログイン）

**学び:**
- WSL2環境では、Dockerの権限設定が必要な場合がある
- `sudo`で実行するか、dockerグループに追加する

---

### 躓きポイント3: docker-compose.ymlのversionフィールド警告

**警告:**
```
WARN: the attribute `version` is obsolete, it will be ignored
```

**原因:**
- Docker Compose v2では`version`フィールドが不要になった（廃止）

**解決方法:**
- `version: '3.8'` を削除（警告のみで動作には影響なし）

**学び:**
- Docker Compose v2では`version`フィールドは不要
- 警告のみで動作には影響しないが、将来的には完全削除される可能性
- バージョン固定の心配は不要（Compose Specificationで統一されている）

---

### 躓きポイント4: setup-mysql.shが使われなかった

**状況:**
- `setup-mysql.sh`を作成したが、実際には使わなかった

**原因:**
- Docker Composeで`init.sql`が自動実行されるため不要だった
- `docker-compose.yml`の`volumes`設定で`./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql`により自動初期化

**学び:**
- Docker Composeを使う場合、初期化SQLは`/docker-entrypoint-initdb.d/`に配置すれば自動実行される
- 直接インストールする場合は`setup-mysql.sh`が有用
- 今回はDockerを使用したため、スクリプトは不要だった

---

## 環境構築のまとめ（2025-11-03）

**最終的なセットアップ手順:**
```bash
# 1. Docker ComposeでMySQL起動
docker-compose up -d

# 2. 起動確認
docker-compose ps

# 3. 接続確認（必要に応じて）
docker exec -it isucon-practice-mysql mysql -u root -ppassword isucon_practice
```

**重要なポイント:**
- Docker Composeを使えば、MySQLのインストール不要で環境構築できる
- `init.sql`は自動実行されるため、手動実行不要
- ポート番号は`3306`（デフォルト）

