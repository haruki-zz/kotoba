import fs from 'node:fs';
import path from 'node:path';

type JunitSummary = {
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
};

type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const asNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const readJson = <T>(filePath: string): T => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
};

const getAttr = (input: string, name: string) => {
  const match = input.match(new RegExp(`${name}="([^"]+)"`));
  return match ? Number(match[1]) : 0;
};

const parseJunit = (filePath: string): JunitSummary => {
  const xml = fs.readFileSync(filePath, 'utf-8');
  const suiteTags = xml.match(/<testsuite\b[^>]*>/g) ?? [];

  if (suiteTags.length === 0) {
    throw new Error(`No <testsuite> node found in ${filePath}`);
  }

  return suiteTags.reduce<JunitSummary>(
    (acc, tag) => ({
      tests: acc.tests + getAttr(tag, 'tests'),
      failures: acc.failures + getAttr(tag, 'failures'),
      errors: acc.errors + getAttr(tag, 'errors'),
      skipped: acc.skipped + getAttr(tag, 'skipped'),
    }),
    { tests: 0, failures: 0, errors: 0, skipped: 0 }
  );
};

function run() {
  const minTests = asNumber(process.env.QUALITY_MIN_TESTS, 25);
  const junitPath = path.resolve(process.cwd(), 'reports', 'junit.xml');
  const perfPath = path.resolve(process.cwd(), 'reports', 'perf-baseline.json');
  const smokePath = path.resolve(process.cwd(), 'reports', 'stability-smoke.json');

  const junit = parseJunit(junitPath);
  const perf = readJson<{ passed: boolean; metrics: { name: string; durationMs: number }[] }>(perfPath);
  const smoke = readJson<{ passed: boolean; failures: number; heapDeltaMb: number }>(smokePath);

  const checks: CheckResult[] = [
    {
      name: 'Unit/Integration/UI tests',
      passed: junit.failures + junit.errors === 0,
      detail: `tests=${junit.tests}, failures=${junit.failures}, errors=${junit.errors}, skipped=${junit.skipped}`,
    },
    {
      name: 'Minimum test count',
      passed: junit.tests >= minTests,
      detail: `actual=${junit.tests}, required>=${minTests}`,
    },
    {
      name: 'Performance baseline',
      passed: perf.passed,
      detail: perf.metrics.map((item) => `${item.name}=${item.durationMs.toFixed(2)}ms`).join(', '),
    },
    {
      name: 'Stability smoke',
      passed: smoke.passed,
      detail: `failures=${smoke.failures}, heapDeltaMb=${smoke.heapDeltaMb.toFixed(2)}`,
    },
  ];

  const passed = checks.every((check) => check.passed);

  const lines = [
    '# Quality Gate Report',
    '',
    `- Generated at: ${new Date().toISOString()}`,
    `- Status: ${passed ? 'PASS' : 'FAIL'}`,
    '',
    '| Check | Status | Detail |',
    '|---|---|---|',
    ...checks.map(
      (check) => `| ${check.name} | ${check.passed ? 'PASS' : 'FAIL'} | ${check.detail.replace(/\|/g, '\\|')} |`
    ),
    '',
  ];

  const reportPath = path.resolve(process.cwd(), 'reports', 'quality-gate.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join('\n'));

  // eslint-disable-next-line no-console
  console.log(`[quality] Report written to ${reportPath}`);

  if (!passed) {
    // eslint-disable-next-line no-console
    console.error('[quality] Gate failed');
    process.exitCode = 1;
  }
}

try {
  run();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('[quality] Gate failed with exception', error);
  process.exit(1);
}
