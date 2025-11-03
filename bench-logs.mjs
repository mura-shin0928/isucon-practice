// bench-log.mjs
import autocannon from 'autocannon';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import os from 'os';

const args = process.argv.slice(2);
const url = args[0] || 'http://localhost:3000/items-db-cache';
const cIdx = args.indexOf('-c');
const dIdx = args.indexOf('-d');
const connections = cIdx >= 0 ? Number(args[cIdx + 1]) : 10;
const duration = dIdx >= 0 ? Number(args[dIdx + 1]) : 10;

const run = (opts) =>
  new Promise((resolve, reject) => {
    const inst = autocannon({ ...opts, renderProgressBar: true });
    inst.on('done', resolve);
    inst.on('error', reject);
  });

const now = new Date();
// 日本時間（JST = UTC+9）に変換
const jstOffset = 9 * 60 * 60 * 1000; // JSTはUTC+9時間
const jstNow = new Date(now.getTime() + jstOffset);
const ts = jstNow.toISOString().replace(/[:.]/g, '-');
const date = jstNow.toISOString().slice(0, 10);
const logPath = `logs/${date}.md`;

mkdirSync('logs', { recursive: true });

// 新規ファイルならヘッダを書く
if (!existsSync(logPath)) {
  const cpu = (os.cpus()?.[0]?.model || '').trim();
  const envInfo = `${os.type()} ${os.release()} / ${cpu} / ${(os.totalmem() / 1e9).toFixed(1)}GB`;
  writeFileSync(
    logPath,
    `# ${date} Bench Log
環境: ${envInfo}
Node: ${process.version}

`
  );
}

// ---- 前回値の取得（同日ファイルの直近Runを対象） ----
function getPrevMetrics(path) {
  if (!existsSync(path)) return null;
  const text = readFileSync(path, 'utf8');

  // 最後に出現した行を拾うために matchAll → 最後の要素を使う
  const rpsMatches = [...text.matchAll(/\|\s*Requests\/sec\s*\|\s*\*\*(.+?)\*\*\s*\|/g)];
  const latMatches = [...text.matchAll(/\|\s*Avg latency \(ms\)\s*\|\s*([0-9.]+)\s*\|/g)];

  if (rpsMatches.length < 1 || latMatches.length < 1) return null;

  const prevRps = parseFloat(rpsMatches[rpsMatches.length - 1][1]);
  const prevLat = parseFloat(latMatches[latMatches.length - 1][1]);

  if (Number.isFinite(prevRps) && Number.isFinite(prevLat)) {
    return { prevRps, prevLat };
  }
  return null;
}

const prev = getPrevMetrics(logPath);

// 軽いウォームアップ（本計測に含めない）
await run({
  url,
  connections,
  duration: Math.min(3, Math.max(1, Math.floor(duration / 3))),
});

// 本計測
const res = await run({ url, connections, duration });

// 値の取り出し（autocannon のバージョン差に配慮）
const pick = (obj, paths) =>
  paths.reduce(
    (v, p) => v ?? p.split('.').reduce((a, k) => (a || {})[k], obj),
    undefined
  );

const rps = pick(res, ['requests.average', 'requests.mean', 'requests.p50']);
const latAvg = pick(res, ['latency.average', 'latency.mean']);

// ★ p95 がない版があるため：p95 → p99 → p90 の順にフォールバック
const latP95 =
  pick(res, ['latency.p95']) ??
  pick(res, ['latency.p99']) ??
  pick(res, ['latency.p90']);

const bytes =
  pick(res, ['throughput.average', 'throughput.mean']) ?? undefined;
const errors = res.errors ?? 0;

const num = (n) =>
  typeof n === 'number' && Number.isFinite(n) ? n.toFixed(2) : String(n);

// 前回比の計算（同日内の前 Run と比較）
function diffStr(curr, prev) {
  if (!Number.isFinite(curr) || !Number.isFinite(prev)) return '—';
  const delta = curr - prev;
  const pct = prev !== 0 ? (delta / prev) * 100 : 0;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)} (${sign}${pct.toFixed(1)}%)`;
}

const rpsDiff = prev ? diffStr(rps, prev.prevRps) : '— (baseline)';
const latDiff = prev ? diffStr(latAvg, prev.prevLat) : '— (baseline)';

// サンプルリクエストを実行して処理時間を取得
let processingTimeMs = null;
try {
  const response = await fetch(url);
  const data = await response.json();
  // elapsedMs または processingTimeMs の両方に対応
  if (data && typeof data.elapsedMs === 'number') {
    processingTimeMs = data.elapsedMs;
  } else if (data && typeof data.processingTimeMs === 'number') {
    processingTimeMs = data.processingTimeMs;
  }
} catch (err) {
  // エラーが発生しても続行
  console.warn(`Warning: Could not fetch processing time: ${err.message}`);
}

// 追記するMarkdown
const md = `
## Run ${ts}
対象: ${url}
設定: connections=${connections}, duration=${duration}s

| 指標 | 値 |
|---|---|
| Requests/sec | **${num(rps)}** |
| Avg latency (ms) | ${num(latAvg)} |
| p95 latency (ms) | ${num(latP95)} |
| Throughput (bytes/s) | ${num(bytes)} |
| Processing time (ms) | ${processingTimeMs !== null ? num(processingTimeMs) : '—'} |
| Errors | ${errors} |

### 前回比
| 指標 | 直近 | 前回 | 差分 |
|---|---:|---:|---:|
| Requests/sec | ${num(rps)} | ${prev ? num(prev.prevRps) : '—'} | ${rpsDiff} |
| Avg latency (ms) | ${num(latAvg)} | ${prev ? num(prev.prevLat) : '—'} | ${latDiff} |

`;

appendFileSync(logPath, md);
console.log(`Logged -> ${logPath}`);
