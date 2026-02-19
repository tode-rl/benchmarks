# Benchmark Methodology

This document describes how ComputeSDK Benchmarks measures sandbox provider performance. Our goal is transparent, reproducible, and fair measurement.

## What We Measure

### Time to Interactive (TTI)

**Definition**: The wall-clock time from initiating a sandbox creation request to successfully executing the first command.

TTI captures the complete developer experience:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Time to Interactive (TTI)                        │
├─────────────┬─────────────────┬──────────────┬─────────────┬───────────┤
│ API Latency │ Provisioning    │ Boot Time    │ Health Check│ Command   │
│             │                 │              │ Polling     │ Execution │
└─────────────┴─────────────────┴──────────────┴─────────────┴───────────┘
```

This metric matters because it's what developers actually experience—the time spent waiting before they can use the sandbox.

### What's Included in TTI

- Network round-trip to provider API
- Queue time (if provider has provisioning queues)
- Infrastructure allocation (VM, container, or serverless spin-up)
- Operating system and runtime boot
- Provider daemon/agent initialization
- Health check and readiness polling
- First command network round-trip
- Command execution time (trivial for our test command)

### What's NOT Included

- Sandbox teardown/destruction time
- Subsequent command execution times
- File system operations
- Network transfer speeds within the sandbox

## Test Procedure

Each benchmark iteration executes the following steps:

```typescript
// 1. Start timer
const start = performance.now();

// 2. Create sandbox and wait until ready
const sandbox = await compute.sandbox.create();

// 3. Execute a trivial command to confirm interactivity
await sandbox.runCommand('echo "benchmark"');

// 4. Stop timer
const ttiMs = performance.now() - start;

// 5. Cleanup (not timed)
await sandbox.destroy();
```

### Why `echo "benchmark"`?

We use a minimal command to isolate sandbox startup time from command complexity. The command:
- Has negligible execution time
- Requires no file system access
- Produces deterministic output
- Validates the full request/response cycle

## Test Configuration

### Daily Automated Runs

| Parameter | Value |
|-----------|-------|
| Iterations per provider | 10 |
| Timeout per iteration | 120 seconds |
| Run frequency | Daily at 00:00 UTC |
| Runner environment | GitHub Actions (ubuntu-latest) |
| Node.js version | 20.x |

### Provider Execution Order

Providers are tested **sequentially** to:
- Avoid resource contention on the test runner
- Prevent rate limiting issues
- Ensure consistent network conditions per provider

The order is randomized each run to prevent systematic bias from time-of-day effects.

## Statistical Reporting

For each provider, we report:

| Metric | Description |
|--------|-------------|
| **Min** | Fastest iteration (best case) |
| **Max** | Slowest iteration (worst case) |
| **Median** | Middle value (typical case) |
| **Average** | Arithmetic mean |
| **Success Rate** | Iterations completed without error |

We emphasize **median** as the primary metric because it's robust to outliers and represents the typical developer experience.

## Benchmark Modes

### Direct Mode

Tests each provider's native SDK without any abstraction layer.

```typescript
import { E2B } from '@computesdk/e2b';

const compute = new E2B({ apiKey: process.env.E2B_API_KEY });
const sandbox = await compute.sandbox.create();
```

**Purpose**: Measure raw provider performance.

### Magic Mode

Tests providers through the ComputeSDK orchestrator.

```typescript
import { compute } from 'computesdk';

compute.setConfig({ provider: 'e2b', ... });
const sandbox = await compute.sandbox.create();
```

**Purpose**: Measure the experience when using ComputeSDK's abstraction layer.

**Note**: Magic Mode includes additional latency from the ComputeSDK orchestrator (Tributary routing + Daemon protocol). This is intentional—it measures the real-world experience for ComputeSDK users.

## Environment & Infrastructure

### Test Runner

All benchmarks run on GitHub Actions hosted runners:

- **OS**: Ubuntu (latest LTS)
- **CPU**: 2-core x86_64
- **Memory**: 7 GB
- **Network**: GitHub's shared datacenter network
- **Location**: Azure US regions (GitHub's infrastructure)

### Network Considerations

Network latency between the GitHub runner and each provider's API endpoints varies. This is **intentional**—it reflects real-world conditions where developers call these APIs from various locations.

We do not:
- Run from provider-specific regions to artificially reduce latency
- Use dedicated/reserved network capacity
- Retry failed requests (failures count against success rate)

## Fairness & Limitations

### What This Benchmark Shows

- Relative performance between providers under consistent conditions
- Typical cold-start times for on-demand sandbox creation
- Provider reliability (success rate over time)

### What This Benchmark Does NOT Show

- Performance with pre-warmed pools or snapshots
- Performance under high concurrency (coming Q2 2026)
- Geographic variation (coming Q3 2026)
- Cost efficiency
- Feature differences between providers

### Provider-Specific Notes

Some providers offer optimizations that aren't captured in our default test:

| Provider | Available Optimization | Benchmark Status |
|----------|----------------------|------------------|
| E2B | Snapshots | Not tested (yet) |
| Daytona | Templates | Not tested (yet) |
| Modal | Warm containers | Not tested (yet) |
| Namespace | Liquid pools | Not tested (yet) |

We plan to add warm-start benchmarks in Q3 2026.

## Data & Reproducibility

### Raw Data

All benchmark results are committed to this repository:

```
results/
├── 2026-02-19T00-30-31-832Z.json      # Magic mode results
├── direct-2026-02-19T00-30-31-832Z.json # Direct mode results
└── ...
```

### JSON Schema

```json
{
  "timestamp": "ISO 8601 timestamp",
  "results": [
    {
      "provider": "provider-name",
      "iterations": [
        { "ttiMs": 123.45 },
        { "ttiMs": 0, "error": "error message" }
      ],
      "summary": {
        "ttiMs": {
          "min": 100.0,
          "max": 150.0,
          "median": 125.0,
          "avg": 124.5
        }
      },
      "skipped": false,
      "skipReason": null
    }
  ]
}
```

### Running Locally

Reproduce our results:

```bash
git clone https://github.com/computesdk/benchmarks.git
cd benchmarks
npm install
cp env.example .env  # Add your API keys

# Run with same settings as CI
npm run bench:direct -- --iterations 10
```

**Note**: Your results will differ based on your network location and conditions.

## Changelog

| Date | Change |
|------|--------|
| 2026-02-19 | Initial methodology documentation |
| 2026-02-01 | Increased default iterations from 3 to 10 |
| 2026-01-15 | Added Direct Mode benchmarks |

## Questions & Disputes

Providers or users who have questions about methodology or wish to dispute results should open a GitHub issue. We commit to:

- Responding within 5 business days
- Investigating any reproducible discrepancies
- Updating methodology if we identify unfairness
- Publishing corrections if errors are found

Contact: benchmarks@computesdk.com
