import { compute } from 'computesdk';
import type { BenchmarkConfig, BenchmarkResult, TimingResult, Stats } from './types.js';

function computeStats(values: number[]): Stats {
  if (values.length === 0) return { min: 0, max: 0, median: 0, avg: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median,
    avg: values.reduce((a, b) => a + b, 0) / values.length,
  };
}

export async function runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
  const { name, iterations = 3, timeout = 120_000, requiredEnvVars } = config;

  // Check if all required credentials are available
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    return {
      provider: name,
      iterations: [],
      summary: { ttiMs: { min: 0, max: 0, median: 0, avg: 0 } },
      skipped: true,
      skipReason: `Missing: ${missingVars.join(', ')}`,
    };
  }

  // Build provider-specific config from env vars
  const providerConfig: Record<string, string> = {};
  for (const [envVar, configField] of Object.entries(config.envToConfig)) {
    providerConfig[configField] = process.env[envVar]!;
  }

  // Configure compute to use this provider
  compute.setConfig({
    provider: name,
    computesdkApiKey: process.env.COMPUTESDK_API_KEY!,
    [name]: providerConfig,
  } as any);

  const results: TimingResult[] = [];

  console.log(`\n--- Benchmarking: ${name} (${iterations} iterations) ---`);

  for (let i = 0; i < iterations; i++) {
    console.log(`  Iteration ${i + 1}/${iterations}...`);

    try {
      const iterationResult = await runIteration(timeout);
      results.push(iterationResult);
      console.log(`    TTI: ${(iterationResult.ttiMs / 1000).toFixed(2)}s`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.log(`    FAILED: ${error}`);
      results.push({ ttiMs: 0, error });
    }
  }

  const successful = results.filter(r => !r.error);

  return {
    provider: name,
    iterations: results,
    summary: {
      ttiMs: computeStats(successful.map(r => r.ttiMs)),
    },
  };
}

async function runIteration(timeout: number): Promise<TimingResult> {
  let sandbox: any = null;

  try {
    // Measure total time: create sandbox + first code execution
    const start = performance.now();

    sandbox = await withTimeout(compute.sandbox.create(), timeout, 'Sandbox creation timed out');

    await withTimeout(
      sandbox.runCommand('echo "benchmark"'),
      30_000,
      'First command execution timed out'
    );

    const ttiMs = performance.now() - start;

    return { ttiMs };
  } finally {
    if (sandbox) {
      try {
        await Promise.race([
          sandbox.destroy(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Destroy timeout')), 15_000)),
        ]);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}