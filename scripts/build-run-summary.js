// Converts Playwright's --reporter=json output into a small run summary
// the dashboard can fetch directly, and appends it to docs/results/index.json.
// Run automatically by .github/workflows/e2e.yml after every test run.

const fs = require('fs');
const path = require('path');

const REPORT_PATH = process.env.REPORT_PATH || 'pw-report.json';
const RESULTS_DIR = path.join('docs', 'results');
const INDEX_PATH = path.join(RESULTS_DIR, 'index.json');
const MAX_RUNS_KEPT = 40; // keeps the dashboard/history from growing unbounded

function extractTests(node, acc, prefix) {
  const title = prefix ? (node.title ? `${prefix} > ${node.title}` : prefix) : (node.title || '');
  if (Array.isArray(node.specs)) {
    node.specs.forEach((spec) => {
      (spec.tests || []).forEach((t) => {
        const results = t.results || [];
        const last = results[results.length - 1] || {};
        acc.push({
          title: `${title ? title + ' > ' : ''}${spec.title}`,
          status: last.status || 'skipped',
          duration: last.duration || 0,
        });
      });
    });
  }
  if (Array.isArray(node.suites)) {
    node.suites.forEach((s) => extractTests(s, acc, title));
  }
  return acc;
}

function main() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error(`Report not found at ${REPORT_PATH} — did the Playwright run produce JSON output?`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  const tests = [];
  (data.suites || []).forEach((s) => extractTests(s, tests, ''));

  const timestamp = Date.now();
  const id = `run-${timestamp}`;
  const label = process.env.RUN_LABEL || `Run — ${new Date(timestamp).toISOString()}`;
  const runFile = `${id}.json`;

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(RESULTS_DIR, runFile),
    JSON.stringify({ id, timestamp, label, tests }, null, 2)
  );

  let index = [];
  if (fs.existsSync(INDEX_PATH)) {
    index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  }
  index.push({ id, timestamp, label, file: runFile });
  index.sort((a, b) => a.timestamp - b.timestamp);

  if (index.length > MAX_RUNS_KEPT) {
    const removed = index.splice(0, index.length - MAX_RUNS_KEPT);
    removed.forEach((r) => {
      const p = path.join(RESULTS_DIR, r.file);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  console.log(`Wrote ${runFile} — dashboard history now has ${index.length} run(s).`);
}

main();
