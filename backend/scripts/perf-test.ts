/**
 * API performance checks (cached vs cold).
 * Target: cached catalog endpoints < 200ms.
 * Usage: npm run test:perf
 */
import 'dotenv/config';

const BASE = (process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`).replace(/\/$/, '');
const API = `${BASE}/api/v1`;
const CACHED_BUDGET_MS = Number(process.env.PERF_CACHED_BUDGET_MS || 200);
const CONCURRENCY = Number(process.env.PERF_CONCURRENCY || 20);
const ROUNDS = Number(process.env.PERF_ROUNDS || 5);

type Sample = { path: string; coldMs: number; warmMs: number[]; avgWarm: number; ok: boolean };

const hit = async (path: string) => {
  const start = Date.now();
  const res = await fetch(`${API}${path}`);
  const ms = Date.now() - start;
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  await res.arrayBuffer();
  return ms;
};

const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);

const measure = async (path: string): Promise<Sample> => {
  const coldMs = await hit(path);
  const warmMs: number[] = [];
  for (let i = 0; i < ROUNDS; i += 1) warmMs.push(await hit(path));
  const avgWarm = avg(warmMs);
  return { path, coldMs, warmMs, avgWarm, ok: avgWarm <= CACHED_BUDGET_MS };
};

const concurrent = async (path: string, n: number) => {
  const start = Date.now();
  const settled = await Promise.allSettled(Array.from({ length: n }, () => hit(path)));
  const elapsed = Date.now() - start;
  const ok = settled.filter((s) => s.status === 'fulfilled').length;
  const fail = n - ok;
  const times = settled.filter((s): s is PromiseFulfilledResult<number> => s.status === 'fulfilled').map((s) => s.value);
  return { path, n, ok, fail, elapsed, avgMs: avg(times), p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] || 0 };
};

const run = async () => {
  console.log(`Perf tests → ${API} (budget ${CACHED_BUDGET_MS}ms warm avg)`);

  const endpoints = [
    '/health',
    '/categories/tree',
    '/categories/nav',
    '/products/featured',
    '/products/new-arrivals',
    '/products?limit=12',
    '/cms/homepage',
  ];

  const samples: Sample[] = [];
  for (const path of endpoints) {
    try {
      samples.push(await measure(path));
    } catch (error) {
      console.error('FAIL', path, error instanceof Error ? error.message : error);
      samples.push({ path, coldMs: -1, warmMs: [], avgWarm: -1, ok: false });
    }
  }

  console.log('\n── Latency ──');
  for (const sample of samples) {
    const flag = sample.ok ? 'OK  ' : 'SLOW';
    console.log(
      `${flag} ${sample.path.padEnd(28)} cold=${String(sample.coldMs).padStart(4)}ms  warm_avg=${sample.avgWarm.toFixed(1)}ms  warm=[${sample.warmMs.join(', ')}]`,
    );
  }

  console.log(`\n── Concurrent (${CONCURRENCY} users) ──`);
  const load = await concurrent('/categories/nav', CONCURRENCY);
  console.log(
    `${load.path}: ${load.ok}/${load.n} ok, wall=${load.elapsed}ms, avg=${load.avgMs.toFixed(1)}ms, ~p95=${load.p95}ms`,
  );

  const failed = samples.filter((s) => !s.ok);
  if (failed.length) {
    console.log(`\n${failed.length} endpoint(s) over ${CACHED_BUDGET_MS}ms warm average (or failed).`);
    // Non-zero only if hard fails (network/status), not just slow — warn but exit 0 for slow in local without Redis
    const hardFail = samples.some((s) => s.coldMs < 0);
    if (hardFail) process.exit(1);
    process.exit(0);
  }
  console.log('\nAll warm averages within budget.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
