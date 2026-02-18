export interface DirectBenchmarkConfig {
  /** Provider name */
  name: string;
  /** Number of iterations (default: 3) */
  iterations?: number;
  /** Timeout per iteration in ms (default: 120000) */
  timeout?: number;
  /** Environment variables that must all be set to run this benchmark */
  requiredEnvVars: string[];
  /** Returns a configured compute instance using the provider's direct SDK */
  createCompute: () => any;
}

export interface BenchmarkConfig {
  /** Provider name */
  name: string;
  /** Number of iterations (default: 3) */
  iterations?: number;
  /** Timeout per iteration in ms (default: 120000) */
  timeout?: number;
  /** Environment variables that must all be set to run this benchmark */
  requiredEnvVars: string[];
  /** Maps env var names to config field names for setConfig() */
  envToConfig: Record<string, string>;
}

export interface TimingResult {
  /** Total time from start to first successful code execution */
  ttiMs: number;
  /** Error message if this iteration failed */
  error?: string;
}

export interface Stats {
  min: number;
  max: number;
  median: number;
  avg: number;
}

export interface BenchmarkResult {
  provider: string;
  iterations: TimingResult[];
  summary: {
    ttiMs: Stats;
  };
  skipped?: boolean;
  skipReason?: string;
}