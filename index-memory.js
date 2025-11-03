// index-memory.js
// メモリ上でデータを保持するバージョン（DBアクセスなし）
import express from "express";
const app = express();
const port = 3001; // DB版とポートを分ける

// =============================
// キャッシュを格納する変数
// =============================
let itemsCache = null;
let lastFetchedAt = null;
let requestCount = 0;
let cacheHitCount = 0;

// =============================
// 重い処理をシミュレート（データベースクエリや計算処理を模擬）
// =============================
async function simulateHeavyOperation() {
  // CPU集約的な処理をシミュレート（10-20ms程度の遅延）
  const start = Date.now();
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i) * Math.random();
  }
  const processingTime = Date.now() - start;
  
  // さらにネットワークI/OやDBアクセスをシミュレート（5-15ms）
  await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 10));
  
  return processingTime;
}

// =============================
// データ生成処理（重い処理を含む）
// =============================
async function generateItems() {
  await simulateHeavyOperation();
  
  // より大きなデータセットを生成
  const items = [];
  for (let i = 1; i <= 100; i++) {
    items.push({
      id: i,
      name: `Item ${i}`,
      description: `This is item number ${i} with some description text`,
      price: Math.floor(Math.random() * 10000),
      category: ['Electronics', 'Food', 'Clothing', 'Books'][i % 4],
    });
  }
  return items;
}

// =============================
// エンドポイント
// =============================

// A) キャッシュ付き
app.get("/items", async (req, res) => {
  const startTime = Date.now();
  requestCount++;
  
  // キャッシュがあればそれを返す（即座に返す）
  if (itemsCache) {
    cacheHitCount++;
    const responseTime = Date.now() - startTime;
    return res.json({
      source: "cache",
      fetchedAt: lastFetchedAt,
      processingTimeMs: responseTime,
      items: itemsCache,
    });
  }

  // キャッシュがない場合は重い処理を実行
  const items = await generateItems();

  // キャッシュに保存
  itemsCache = items;
  lastFetchedAt = new Date().toISOString();
  const responseTime = Date.now() - startTime;

  res.json({
    source: "fresh",
    fetchedAt: lastFetchedAt,
    processingTimeMs: responseTime,
    items,
  });
});

// B) キャッシュなし版（比較用）
app.get("/items-no-cache", async (req, res) => {
  const startTime = Date.now();
  const items = await generateItems();
  const responseTime = Date.now() - startTime;

  res.json({
    source: "no-cache",
    processingTimeMs: responseTime,
    items,
  });
});

// C) 統計情報を取得するエンドポイント
app.get("/stats", (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    requestCount,
    cacheHitCount,
    cacheHitRate: requestCount > 0 ? (cacheHitCount / requestCount * 100).toFixed(2) + "%" : "0%",
    memory: {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2) + " MB",
      heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + " MB",
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
      external: (memUsage.external / 1024 / 1024).toFixed(2) + " MB",
    },
  });
});

// D) キャッシュをリセットするエンドポイント（テスト用）
app.post("/cache/reset", (req, res) => {
  itemsCache = null;
  lastFetchedAt = null;
  requestCount = 0;
  cacheHitCount = 0;
  res.json({ message: "Cache reset successfully" });
});

// =============================
// 起動
// =============================
app.listen(port, () => {
  console.log(`Server running:  http://localhost:${port} (Memory version)`);
  console.log(`Cached        ->  GET /items`);
  console.log(`No-cache      ->  GET /items-no-cache`);
  console.log(`Stats         ->  GET /stats`);
});

