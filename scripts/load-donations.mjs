#!/usr/bin/env node

const targetUrl = process.env.LOAD_TARGET_URL ?? "http://localhost:3000";
const memorialId = process.env.LOAD_MEMORIAL_ID;
const total = Number(process.env.LOAD_TOTAL ?? 100);
const concurrency = Number(process.env.LOAD_CONCURRENCY ?? 10);
const confirm = process.env.LOAD_TEST_CONFIRM === "I_UNDERSTAND_THIS_CREATES_DONATIONS";

if (!memorialId) {
  console.error("LOAD_MEMORIAL_ID is required.");
  process.exit(1);
}

if (!Number.isFinite(total) || total < 1 || !Number.isFinite(concurrency) || concurrency < 1) {
  console.error("LOAD_TOTAL and LOAD_CONCURRENCY must be positive numbers.");
  process.exit(1);
}

if (!confirm) {
  console.log("Dry run only. Set LOAD_TEST_CONFIRM=I_UNDERSTAND_THIS_CREATES_DONATIONS to send requests.");
  console.log(JSON.stringify({ targetUrl, memorialId, total, concurrency }, null, 2));
  process.exit(0);
}

const endpoint = new URL("/api/donations", targetUrl).toString();
let next = 0;
let ok = 0;
let failed = 0;
const startedAt = Date.now();

async function worker(workerId) {
  while (next < total) {
    const index = next++;
    const body = {
      memorial_id: memorialId,
      donor_name: `Load Test Donor ${index + 1}`,
      donor_title: `Worker ${workerId}`,
      amount: 100,
      message: "load-test",
      slip_url: null,
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) ok++;
      else {
        failed++;
        const text = await res.text();
        console.error(`request ${index + 1} failed: ${res.status} ${text.slice(0, 200)}`);
      }
    } catch (error) {
      failed++;
      console.error(`request ${index + 1} error:`, error);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index + 1)));

const seconds = (Date.now() - startedAt) / 1000;
console.log(JSON.stringify({
  targetUrl,
  memorialId,
  total,
  concurrency,
  ok,
  failed,
  seconds,
  requestsPerSecond: Number((total / Math.max(seconds, 0.001)).toFixed(2)),
}, null, 2));

if (failed > 0) process.exit(1);
