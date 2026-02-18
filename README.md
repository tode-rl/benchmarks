# ComputeSDK Sandbox Provider Benchmarks

## Methodology

We measure **Time to Interactive (TTI)** — the total wall-clock time from initiating sandbox creation to completing the first command execution.

Each benchmark iteration does the following:

1. `sandbox = await compute.sandbox.create()` — provisions infrastructure, installs the daemon, and waits until the sandbox is ready
2. `sandbox.runCommand('echo "benchmark"')` — executes a trivial command to confirm the sandbox is fully interactive
3. `sandbox.destroy()` — tears down the sandbox (not included in TTI measurement)

A single `performance.now()` timer wraps steps 1 and 2. This captures the full end-user experience: API call latency, infrastructure provisioning, daemon boot, health check polling, and first command round-trip.

Each provider is run for 3 iterations by default (configurable via `--iterations`). Results report min, max, median, and average TTI. Providers are run sequentially to avoid resource contention.

### Two Benchmark Modes

**Magic Mode** — Routes through the ComputeSDK gateway (Tributary + Daemon). Requires `COMPUTESDK_API_KEY`. Tests all 8 providers: e2b, vercel, blaxel, modal, daytona, railway, namespace, render.

**Direct Mode** — Uses the individual provider SDK packages (`@computesdk/e2b`, `@computesdk/daytona`, etc.) directly, bypassing the ComputeSDK gateway. No `COMPUTESDK_API_KEY` needed. Tests 5 providers: e2b, daytona, blaxel, modal, vercel.

## Run Locally

```bash
# Install dependencies
npm install

# Copy .env.example and fill in your API keys
cp .env.example .env
```

### Magic Mode

```bash
npm run bench                    # All providers
npm run bench:e2b                # Single provider
npm run bench -- --iterations 5  # Custom iterations
```

### Direct Mode

```bash
npm run bench:direct                    # All providers
npm run bench:direct:e2b                # Single provider
npm run bench:direct -- --iterations 5  # Custom iterations
```

Results are saved to `results/` as JSON files.
