import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BenchmarkResult } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, 'results');
const SVG_PATH = path.join(ROOT, 'results.svg');

interface ResultFile {
  timestamp: string;
  results: BenchmarkResult[];
}

function getMostRecentFile(): ResultFile | null {
  const files = fs.readdirSync(RESULTS_DIR)
    .filter(f => f.endsWith('.json') && f.startsWith('direct-'))
    .sort()
    .reverse();

  if (files.length === 0) return null;
  const raw = fs.readFileSync(path.join(RESULTS_DIR, files[0]), 'utf-8');
  return JSON.parse(raw);
}

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(2) + 's';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSVG(results: BenchmarkResult[], timestamp: string): string {
  const sorted = [...results]
    .filter(r => !r.skipped)
    .sort((a, b) => a.summary.ttiMs.median - b.summary.ttiMs.median);

  const rowHeight = 40;
  const headerHeight = 50;
  const padding = 20;
  const width = 700;
  const height = headerHeight + (sorted.length * rowHeight) + padding * 2 + 30;

  // Column positions
  const cols = {
    provider: 30,
    median: 200,
    min: 350,
    max: 470,
    status: 590,
  };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .bg { fill: #0d1117; }
    .header-bg { fill: #161b22; }
    .header { font: bold 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; fill: #8b949e; }
    .row { font: 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; fill: #c9d1d9; }
    .provider { font-weight: 600; fill: #58a6ff; }
    .median { font-weight: 700; fill: #7ee787; }
    .status { fill: #8b949e; }
    .divider { stroke: #21262d; stroke-width: 1; }
    .timestamp { font: 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; fill: #6e7681; }
    .title { font: bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; fill: #c9d1d9; }
  </style>
  
  <!-- Background -->
  <rect class="bg" width="${width}" height="${height}" rx="6"/>
  
  <!-- Header background -->
  <rect class="header-bg" x="0" y="0" width="${width}" height="${headerHeight}" rx="6"/>
  <rect class="bg" x="0" y="6" width="${width}" height="${headerHeight - 6}"/>
  <rect class="header-bg" x="0" y="0" width="${width}" height="${headerHeight}"/>
  
  <!-- Header text -->
  <text class="header" x="${cols.provider}" y="32">Provider</text>
  <text class="header" x="${cols.median}" y="32">Median TTI</text>
  <text class="header" x="${cols.min}" y="32">Min</text>
  <text class="header" x="${cols.max}" y="32">Max</text>
  <text class="header" x="${cols.status}" y="32">Status</text>
  
  <!-- Divider -->
  <line class="divider" x1="0" y1="${headerHeight}" x2="${width}" y2="${headerHeight}"/>
`;

  sorted.forEach((r, i) => {
    const y = headerHeight + padding + (i * rowHeight) + 25;
    const ok = r.iterations.filter(it => !it.error).length;
    const total = r.iterations.length;
    
    svg += `
  <!-- Row ${i + 1} -->
  <text class="row provider" x="${cols.provider}" y="${y}">${capitalize(r.provider)}</text>
  <text class="row median" x="${cols.median}" y="${y}">${formatSeconds(r.summary.ttiMs.median)}</text>
  <text class="row" x="${cols.min}" y="${y}">${formatSeconds(r.summary.ttiMs.min)}</text>
  <text class="row" x="${cols.max}" y="${y}">${formatSeconds(r.summary.ttiMs.max)}</text>
  <text class="row status" x="${cols.status}" y="${y}">${ok}/${total}</text>
`;
    
    if (i < sorted.length - 1) {
      svg += `  <line class="divider" x1="${padding}" y1="${headerHeight + padding + ((i + 1) * rowHeight)}" x2="${width - padding}" y2="${headerHeight + padding + ((i + 1) * rowHeight)}"/>
`;
    }
  });

  const date = new Date(timestamp).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  svg += `
  <!-- Timestamp -->
  <text class="timestamp" x="${padding}" y="${height - 12}">Last updated: ${date}</text>
  
</svg>`;

  return svg;
}

function main() {
  const data = getMostRecentFile();
  
  if (!data) {
    console.error('No benchmark results found');
    process.exit(1);
  }

  const svg = generateSVG(data.results, data.timestamp);
  fs.writeFileSync(SVG_PATH, svg);
  console.log(`SVG written to ${SVG_PATH}`);
}

main();
