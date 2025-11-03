// server.js or app.js
import express from "express";
const app = express();
const port = 3000;

// キャッシュを格納する変数
let itemsCache = null;
let lastFetchedAt = null;
let requestCount = 0;
let cacheHitCount = 0;

// 重い処理をシミュレート（データベースクエリや計算処理を模擬）
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

// データ生成処理（重い処理を含む）
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

// キャッシュなし版（比較用）
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

// 統計情報を取得するエンドポイント
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

// キャッシュをリセットするエンドポイント（テスト用）
app.post("/cache/reset", (req, res) => {
  itemsCache = null;
  lastFetchedAt = null;
  requestCount = 0;
  cacheHitCount = 0;
  res.json({ message: "Cache reset successfully" });
});

// キャッシュをウォームアップする関数
async function warmupCache() {
  console.log('Warming up cache...');
  try {
    // 初回リクエストでキャッシュをロード
    await generateItems().then(items => {
      itemsCache = items;
      lastFetchedAt = new Date().toISOString();
    });
    console.log('Cache warmed up successfully');
  } catch (err) {
    console.error('Failed to warm up cache:', err.message);
  }
}

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Stats endpoint: http://localhost:${port}/stats`);
  console.log(`Cached endpoint: http://localhost:${port}/items`);
  console.log(`No-cache endpoint (for comparison): http://localhost:${port}/items-no-cache`);
  
  // サーバー起動時にキャッシュをウォームアップ
  await warmupCache();
});
