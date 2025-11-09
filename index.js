// index.js
import express from "express";
import mysql from "mysql2/promise";

const app = express();
const port = 3000;

// =============================
// MySQL プール
// =============================
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "password",
  database: process.env.MYSQL_DB || "isucon_practice",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// =============================
// キャッシュ用（DB結果のTTLキャッシュ）
// =============================
let dbBufCache = null;        // Buffer化した固定レスポンス
let dbCacheExpiresAt = 0;     // 期限（ms）
const DB_CACHE_TTL_MS = 60_000; // 60s: 計測10s+ウォームアップを覆う長め

// =============================
// 共通: DBからitems取得
// =============================
async function fetchItemsFromDB(query = "") {
  const [rows] = query ? 
    await pool.query(`SELECT id, name, description, price, category FROM items WHERE category = ?`, [query]) :
    await pool.query("SELECT id, name, description, price, category FROM items");
  return rows;
}

// =============================
// エンドポイント
// =============================

// A) 毎回DBアクセス（キャッシュなし）
app.get("/items-db", async (req, res) => {
  const start = Date.now();
  const category = req.query?.category;
  const items = await fetchItemsFromDB(category);
  res.json({ source: "db", elapsedMs: Date.now() - start, items });
});

// B) TTLキャッシュ（ヒット時ゼロ変換）
// - JSON文字列→Bufferを事前生成して再利用
// - 動的フィールドは入れない（毎回stringifyを避ける）
app.set("etag", false);
app.get("/items-db-cache", async (_req, res) => {
  const start = Date.now();
  const now = Date.now();
  
  // キャッシュヒット時
  if (dbBufCache && now < dbCacheExpiresAt) {
    const elapsedMs = Date.now() - start;
    // キャッシュヒット時は処理時間を追加（計測用）
    // ただし、BufferではなくJSONで返す（計測のため）
    const cached = JSON.parse(dbBufCache.toString());
    return res.json({ ...cached, elapsedMs, cacheHit: true });
  }
  
  // キャッシュミス時：DBから取得
  const items = await fetchItemsFromDB();
  const elapsedMs = Date.now() - start;
  
  // キャッシュに保存（動的フィールドを除く）
  dbBufCache = Buffer.from(JSON.stringify({ source: "db-cache", items }));
  dbCacheExpiresAt = now + DB_CACHE_TTL_MS;
  
  // レスポンスには処理時間を含める
  res.json({ source: "db-cache", elapsedMs, cacheHit: false, items });
});

// C) 簡易統計（確認用）
app.get("/stats", (_req, res) => {
  const m = process.memoryUsage();
  res.json({
    cacheValidForMs: Math.max(0, dbCacheExpiresAt - Date.now()),
    memoryMB: {
      rss: +(m.rss / 1024 / 1024).toFixed(2),
      heapUsed: +(m.heapUsed / 1024 / 1024).toFixed(2),
    },
  });
});

// =============================
// 起動
// =============================
app.listen(port, () => {
  console.log(`Server running:  http://localhost:${port}`);
  console.log(`DB no-cache  ->  GET /items-db`);
  console.log(`DB with TTL  ->  GET /items-db-cache`);
  console.log(`Stats        ->  GET /stats`);
});
