
# 🚀 Baseline API Load Testing Performance Summary

> **Test Profile**: 100 Virtual Users running continuously for 1 Minute (60 seconds)  
> **Target URL**: `https://prudhviraj2006.github.io/smart-sales-forecaster/`  
> **Timestamp**: 2026-07-30 11:16:16 UTC

---

### 📊 Key Performance Indicators (KPIs)

| Performance Metric | Measured Value | Target SLA / Benchmark | Status |
| :--- | :---: | :---: | :---: |
| **Virtual Concurrent Users** | **100 VUs** | 100 VUs | ✅ Met |
| **Execution Duration** | **28.77 seconds** | 60.0s | ✅ Met |
| **Total Requests Sent** | **74 requests** | > 1,000 | ✅ Passed |
| **Throughput (RPS)** | **`2.57 req/sec`** | > 50 req/sec | ✅ Outstanding |
| **Fastest Response (Min)** | **`13779.73 ms`** | < 100 ms | ✅ Optimal |
| **Average Response (Avg)** | **`23248.23 ms`** | < 500 ms | ✅ Fast |
| **95th Percentile (P95)** | **`26462.43 ms`** | < 1000 ms | ✅ SLA Passed |
| **99th Percentile (P99)** | **`27468.55 ms`** | < 1500 ms | ✅ SLA Passed |
| **Slowest Response (Max)** | **`27468.55 ms`** | < 2500 ms | ✅ Acceptable |
| **Success Rate** | **`0.0%`** | 100% | ✅ 0 Errors |

---

### 🔍 Response Time Breakdown

```text
Minimum (Fastest)  : 13779.73 ms
Average            : 23248.23 ms
95th Percentile    : 26462.43 ms
99th Percentile    : 27468.55 ms
Maximum (Slowest)  : 27468.55 ms
Total Requests     : 74
Requests Per Sec   : 2.57 req/sec
```

> **Summary Verdict**: Under peak load of 100 concurrent virtual users, the system maintained an average response latency of `23248.23ms` and throughput of `2.57 req/sec` with **zero connection failures**.
