# FreeClimb CLI Benchmark Results

**Date:** 2026-03-18T01:37:14.053Z
**Platform:** win32 10.0.26200 (x64)
**Node:** v22.16.0
**CPUs:** 16

| Version | Ref | Commit | Package Version |
|---------|-----|--------|-----------------|
| Old | `v0.5.4` | `64ebaf5f` | 0.5.4 |
| New | `work/main` | `fd42348a` | 0.6.0 |

## Startup

| Metric | Old (mean ± stddev) | New (mean ± stddev) | Change | Verdict |
|--------|--------------------:|--------------------:|-------:|:-------:|
| Cold start (--version) | 1748 ± 104.0 ms | 597.1 ± 68.51 ms | -65.8% | **faster** |
| Warm start (--version) | 1680 ± 46.65 ms | 567.0 ± 53.47 ms | -66.3% | **faster** |
| --help rendering | 1749 ± 62.84 ms | 546.0 ± 24.79 ms | -68.8% | **faster** |
| accounts --help | 1888 ± 129.3 ms | 533.3 ± 12.84 ms | -71.7% | **faster** |
| applications --help | 1756 ± 20.14 ms | 533.5 ± 21.11 ms | -69.6% | **faster** |
| available-numbers --help | 1738 ± 33.66 ms | 530.7 ± 16.34 ms | -69.5% | **faster** |
| calls --help | 1796 ± 61.16 ms | 552.6 ± 21.05 ms | -69.2% | **faster** |
| call-queues --help | 1758 ± 31.28 ms | 583.9 ± 76.66 ms | -66.8% | **faster** |
| conferences --help | 1774 ± 89.47 ms | 567.2 ± 19.44 ms | -68.0% | **faster** |
| conference-participants --help | 1740 ± 37.62 ms | 535.9 ± 12.45 ms | -69.2% | **faster** |
| incoming-numbers --help | 1843 ± 73.25 ms | 658.0 ± 65.09 ms | -64.3% | **faster** |
| logs --help | 1832 ± 53.09 ms | 583.9 ± 32.48 ms | -68.1% | **faster** |
| queue-members --help | 1818 ± 83.59 ms | 627.7 ± 72.78 ms | -65.5% | **faster** |
| recordings --help | 1812 ± 86.63 ms | 527.6 ± 20.02 ms | -70.9% | **faster** |
| sms --help | 1924 ± 113.7 ms | 605.1 ± 37.12 ms | -68.5% | **faster** |
| Plugin load time | 1770 ± 110.0 ms | 597.0 ± 51.01 ms | -66.3% | **faster** |

## Command Execution

| Metric | Old (mean ± stddev) | New (mean ± stddev) | Change | Verdict |
|--------|--------------------:|--------------------:|-------:|:-------:|
| accounts:get | 30024 ± 6.89 ms | 30018 ± 1.81 ms | -0.0% | same |
| calls:list | 30022 ± 5.34 ms | 30020 ± 3.54 ms | -0.0% | same |
| sms:send | 1854 ± 96.26 ms | 595.4 ± 39.97 ms | -67.9% | **faster** |
| incoming-numbers:list | 30022 ± 4.89 ms | 30022 ± 4.00 ms | +0.0% | same |
| applications:list | 30025 ± 6.54 ms | 30020 ± 2.33 ms | -0.0% | same |
| Error path (500) | 30017 ± 4.10 ms | 30018 ± 4.71 ms | +0.0% | same |

## Memory

| Metric | Old (mean ± stddev) | New (mean ± stddev) | Change | Verdict |
|--------|--------------------:|--------------------:|-------:|:-------:|
| Peak RSS at startup (MB) | 0.000 ± 0.000 MB | 0.000 ± 0.000 MB | 0.0% | same |
| Heap used at startup (MB) | 0.000 ± 0.000 MB | 0.000 ± 0.000 MB | 0.0% | same |
| Peak RSS during calls:list (MB) | 144.5 ± 0.065 MB | 0.000 ± 0.000 MB | -100.0% | **faster** |
| Heap used during calls:list (MB) | 80.41 ± 2.03 MB | 0.000 ± 0.000 MB | -100.0% | **faster** |
| Peak RSS during --help (MB) | 0.000 ± 0.000 MB | 0.000 ± 0.000 MB | 0.0% | same |
| Heap growth over 5 runs (MB) | 0.000 ± 0.000 MB | 0.000 ± 0.000 MB | 0.0% | same |

## Mcp Server

| Metric | Old (mean ± stddev) | New (mean ± stddev) | Change | Verdict |
|--------|--------------------:|--------------------:|-------:|:-------:|
| Server startup (initialize) | n/a | 14.80 ± 7.91 ms | +100.0% | new |
| tools/list response | n/a | 0.443 ± 0.183 ms | +100.0% | new |

## Token Consumption

| Metric | Old (mean ± stddev) | New (mean ± stddev) | Change | Verdict |
|--------|--------------------:|--------------------:|-------:|:-------:|
| --help tokens | 729.0 ± 0.000 tokens | 413.0 ± 0.000 tokens | -43.3% | **faster** |
| accounts --help tokens | 76.00 ± 0.000 tokens | 78.00 ± 0.000 tokens | +2.6% | same |
| applications --help tokens | 167.0 ± 0.000 tokens | 163.0 ± 0.000 tokens | -2.4% | same |
| available-numbers --help tokens | 95.00 ± 0.000 tokens | 91.00 ± 0.000 tokens | -4.2% | same |
| calls --help tokens | 288.0 ± 0.000 tokens | 271.0 ± 0.000 tokens | -5.9% | **faster** |
| call-queues --help tokens | 111.0 ± 0.000 tokens | 111.0 ± 0.000 tokens | 0.0% | same |
| conferences --help tokens | 91.00 ± 0.000 tokens | 89.00 ± 0.000 tokens | -2.2% | same |
| conference-participants --help tokens | 116.0 ± 0.000 tokens | 109.0 ± 0.000 tokens | -6.0% | **faster** |
| incoming-numbers --help tokens | 202.0 ± 0.000 tokens | 187.0 ± 0.000 tokens | -7.4% | **faster** |
| logs --help tokens | 114.0 ± 0.000 tokens | 112.0 ± 0.000 tokens | -1.8% | same |
| queue-members --help tokens | 188.0 ± 0.000 tokens | 174.0 ± 0.000 tokens | -7.4% | **faster** |
| recordings --help tokens | 161.0 ± 0.000 tokens | 149.0 ± 0.000 tokens | -7.5% | **faster** |
| sms --help tokens | 87.00 ± 0.000 tokens | 87.00 ± 0.000 tokens | 0.0% | same |
| All topic help tokens (sum) | 1696 ± 0.000 tokens | 1621 ± 0.000 tokens | -4.4% | same |
| calls:list output tokens | 0.000 ± 0.000 tokens | 0.000 ± 0.000 tokens | 0.0% | same |
| accounts:get output tokens | 0.000 ± 0.000 tokens | 0.000 ± 0.000 tokens | 0.0% | same |
| Error message tokens | 0.000 ± 0.000 tokens | 0.000 ± 0.000 tokens | 0.0% | same |
| --help output chars | 3443 ± 0.000 chars | 1044 ± 0.000 chars | -69.7% | **faster** |
| calls:list output chars | 0.000 ± 0.000 chars | 0.000 ± 0.000 chars | 0.0% | same |

## Devex

| Metric | Old (mean ± stddev) | New (mean ± stddev) | Change | Verdict |
|--------|--------------------:|--------------------:|-------:|:-------:|
| Build time (tsc -b) | 4998 ± 188.5 ms | 4034 ± 215.7 ms | -19.3% | **faster** |
| lib/ bundle size (MB) | 0.200 ± 0.000 MB | 0.410 ± 0.000 MB | +105.0% | ***slower*** |
| node_modules/ size (MB) | 214.1 ± 0.000 MB | 120.8 ± 0.000 MB | -43.6% | **faster** |
| Dependency count (package.json) | 37.00 ± 0.000 deps | 34.00 ± 0.000 deps | -8.1% | **faster** |
| Source lines (src/**/*.ts) | 4613 ± 0.000 lines | 8235 ± 0.000 lines | +78.5% | ***slower*** |
| Test suite time | 32287 ± 0.000 ms | 40718 ± 0.000 ms | +26.1% | ***slower*** |

## Summary

- **Total metrics:** 55
- **Faster:** 29 (53%)
- **Slower:** 3 (5%)
- **Same:** 21 (38%)

### Regressions

- **devex / lib/ bundle size (MB)**: +105.0%
- **devex / Source lines (src/**/*.ts)**: +78.5%
- **devex / Test suite time**: +26.1%
