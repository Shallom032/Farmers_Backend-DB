import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 }, // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 }, // Stay at 200 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Test homepage/products endpoint (public access)
  const response = http.get(`${BASE_URL}/api/products`);

  // Record custom metrics
  responseTime.add(response.timings.duration);

  // Check response
  const checkResult = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has products array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
    'response size < 1MB': (r) => r.body.length < 1024 * 1024,
  });

  // Record error rate
  errorRate.add(!checkResult);

  // Random sleep between 1-3 seconds to simulate real user behavior
  sleep(Math.random() * 2 + 1);
}

// Setup function - runs before the test starts
export function setup() {
  console.log('Starting homepage API load test');
  console.log(`Target URL: ${BASE_URL}`);

  // Warm-up request to ensure the service is ready
  const warmupResponse = http.get(`${BASE_URL}/api/products`);
  if (warmupResponse.status !== 200) {
    console.error('Warm-up request failed. Service might not be running.');
    console.error(`Status: ${warmupResponse.status}, Body: ${warmupResponse.body}`);
  } else {
    console.log('Warm-up request successful. Starting load test...');
  }
}

// Teardown function - runs after the test completes
export function teardown(data) {
  console.log('Homepage API load test completed');
}

// Handle summary - custom summary output
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'homepage-load-report.json': JSON.stringify(data, null, 2),
    'homepage-load-report.html': htmlReport(data),
  };
}

function textSummary(data, options) {
  return `
📊 Homepage API Load Test Summary
=====================================

Test Duration: ${data.metrics.iteration_duration.values.avg}ms avg iteration
Total Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%

Response Time:
  - Average: ${Math.round(data.metrics.http_req_duration.values.avg)}ms
  - 95th percentile: ${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms
  - 99th percentile: ${Math.round(data.metrics.http_req_duration.values['p(99)'])}ms

Custom Metrics:
  - Error Rate: ${(data.metrics.errors?.values.rate * 100 || 0).toFixed(2)}%
  - Avg Response Time: ${Math.round(data.metrics.response_time?.values.avg || 0)}ms

Thresholds:
  - Response time (95% < 500ms): ${data.metrics.http_req_duration.thresholds['p(95)<500'].ok ? '✅ PASS' : '❌ FAIL'}
  - Error rate (< 10%): ${data.metrics.http_req_failed.thresholds['rate<0.1'].ok ? '✅ PASS' : '❌ FAIL'}
`;
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Homepage API Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .pass { color: green; }
        .fail { color: red; }
        h1, h2 { color: #333; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>🏠 Homepage API Load Test Report</h1>

    <div class="metric">
        <h2>Test Overview</h2>
        <p><strong>Total Requests:</strong> ${data.metrics.http_reqs.values.count}</p>
        <p><strong>Test Duration:</strong> ${Math.round(data.metrics.iteration_duration.values.avg)}ms avg iteration</p>
        <p><strong>Error Rate:</strong> ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</p>
    </div>

    <div class="metric">
        <h2>Response Times</h2>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Average</td><td>${Math.round(data.metrics.http_req_duration.values.avg)}ms</td></tr>
            <tr><td>95th Percentile</td><td>${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms</td></tr>
            <tr><td>99th Percentile</td><td>${Math.round(data.metrics.http_req_duration.values['p(99)'])}ms</td></tr>
        </table>
    </div>

    <div class="metric">
        <h2>Threshold Results</h2>
        <p class="${data.metrics.http_req_duration.thresholds['p(95)<500'].ok ? 'pass' : 'fail'}">
            Response time (95% < 500ms): ${data.metrics.http_req_duration.thresholds['p(95)<500'].ok ? '✅ PASS' : '❌ FAIL'}
        </p>
        <p class="${data.metrics.http_req_failed.thresholds['rate<0.1'].ok ? 'pass' : 'fail'}">
            Error rate (< 10%): ${data.metrics.http_req_failed.thresholds['rate<0.1'].ok ? '✅ PASS' : '❌ FAIL'}
        </p>
    </div>
</body>
</html>
`;
}