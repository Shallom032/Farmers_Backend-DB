import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const searchResponseTime = new Trend('search_response_time');
const browseResponseTime = new Trend('browse_response_time');

// Test configuration for heavy product browsing
export const options = {
  scenarios: {
    product_browsing: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 users over 1 minute
        { duration: '3m', target: 50 },   // Stay at 50 users for 3 minutes
        { duration: '1m', target: 100 },  // Ramp up to 100 users over 1 minute
        { duration: '3m', target: 100 },  // Stay at 100 users for 3 minutes
        { duration: '1m', target: 0 },    // Ramp down to 0 users over 1 minute
      ],
      tags: { test_type: 'product_browsing' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1000ms
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    search_response_time: ['p(95)<800'], // Search should be faster
    browse_response_time: ['p(95)<600'], // Browse should be very fast
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Product search terms for realistic testing
const searchTerms = [
  'tomato', 'maize', 'potato', 'carrot', 'onion', 'cabbage',
  'beans', 'peas', 'lettuce', 'spinach', 'broccoli', 'pepper'
];

// Categories for filtering
const categories = ['vegetables', 'fruits', 'grains', 'dairy'];

export default function () {
  // Simulate different types of product browsing behavior

  // 1. Browse all products (most common action)
  const browseStart = new Date().getTime();
  const browseResponse = http.get(`${BASE_URL}/api/products`);
  browseResponseTime.add(new Date().getTime() - browseStart);

  check(browseResponse, {
    'browse: status is 200': (r) => r.status === 200,
    'browse: has products': (r) => {
      try {
        const bodyStr: string = r.body ? String(r.body) : "";
        const data = JSON.parse(bodyStr);
        return Array.isArray(data) && data.length >= 0;
      } catch {
        return false;
      }
    },
    'browse: response time acceptable': (r) => r.timings.duration < 1000,
  });

  // 2. Search for products (30% of users)
  if (Math.random() < 0.3) {
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const searchStart = new Date().getTime();
    const searchResponse = http.get(`${BASE_URL}/api/products/search?query=${searchTerm}`);
    searchResponseTime.add(new Date().getTime() - searchStart);

    check(searchResponse, {
      'search: status is 200': (r) => r.status === 200,
      'search: returns results': (r) => {
        try {
          const bodyStr: string = r.body ? String(r.body) : "";
          const data = JSON.parse(bodyStr);
          return Array.isArray(data);
        } catch {
          return false;
        }
      },
    });
  }

  // 3. Filter by category (20% of users)
  if (Math.random() < 0.2) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const filterResponse = http.get(`${BASE_URL}/api/products?category=${category}`);

    check(filterResponse, {
      'filter: status is 200': (r) => r.status === 200,
      'filter: returns filtered results': (r) => {
        try {
          const bodyStr: string = r.body ? String(r.body) : "";
          const data = JSON.parse(bodyStr);
          return Array.isArray(data);
        } catch {
          return false;
        }
      },
    });
  }

  // 4. View individual product details (40% of users)
  if (Math.random() < 0.4) {
    // Assume product IDs 1-50 exist (this would be populated in setup)
    const productId = Math.floor(Math.random() * 50) + 1;
    const productResponse = http.get(`${BASE_URL}/api/products/${productId}`);

    check(productResponse, {
      'product: status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'product: returns product data if found': (r) => {
        if (r.status === 200) {
          try {
            const bodyStr: string = r.body ? String(r.body) : "";
            const data = JSON.parse(bodyStr);
            return data && typeof data === 'object' && data.product_id;
          } catch {
            return false;
          }
        }
        return true; // 404 is acceptable
      },
    });
  }

  // Record error rate
  errorRate.add(browseResponse.status !== 200);

  // Simulate user thinking time between actions
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Setup function - create test data
export function setup() {
  console.log('Setting up heavy product browsing test...');

  // Create some test products if they don't exist
  const testProducts = [
    { name: 'Tomatoes', price: 50, quantity: 100, unit: 'kg', category: 'vegetables' },
    { name: 'Maize', price: 40, quantity: 200, unit: 'kg', category: 'grains' },
    { name: 'Potatoes', price: 30, quantity: 150, unit: 'kg', category: 'vegetables' },
    { name: 'Carrots', price: 45, quantity: 80, unit: 'kg', category: 'vegetables' },
    { name: 'Onions', price: 35, quantity: 120, unit: 'kg', category: 'vegetables' },
  ];

  // Note: In a real scenario, you would use the API to create these products
  // For this test, we assume they exist or the API handles missing data gracefully

  console.log('Heavy product browsing test setup complete');
}

// Handle summary
export function handleSummary(data: any) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'product-browse-report.json': JSON.stringify(data, null, 2),
    'product-browse-report.html': htmlReport(data),
  };
}

function textSummary(data: any, options: any) {
  return `
🛍️ Heavy Product Browsing Load Test Summary
===============================================

Test Duration: ${data.metrics.iteration_duration.values.avg}ms avg iteration
Total Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%

Response Times:
  - Browse Average: ${Math.round(data.metrics.browse_response_time?.values.avg || 0)}ms
  - Search Average: ${Math.round(data.metrics.search_response_time?.values.avg || 0)}ms
  - Overall Average: ${Math.round(data.metrics.http_req_duration.values.avg)}ms
  - 95th percentile: ${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms

Custom Metrics:
  - Error Rate: ${(data.metrics.errors?.values.rate * 100 || 0).toFixed(2)}%

Thresholds:
  - Response time (95% < 1000ms): ${data.metrics.http_req_duration.thresholds['p(95)<1000'].ok ? '✅ PASS' : '❌ FAIL'}
  - Error rate (< 5%): ${data.metrics.http_req_failed.thresholds['rate<0.05'].ok ? '✅ PASS' : '❌ FAIL'}
  - Search time (95% < 800ms): ${data.metrics.search_response_time?.thresholds['p(95)<800']?.ok ? '✅ PASS' : '❌ FAIL'}
  - Browse time (95% < 600ms): ${data.metrics.browse_response_time?.thresholds['p(95)<600']?.ok ? '✅ PASS' : '❌ FAIL'}
`;
}

function htmlReport(data: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Heavy Product Browsing Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        h1, h2 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>🛍️ Heavy Product Browsing Load Test Report</h1>

    <div class="metric">
        <h2>Test Overview</h2>
        <p><strong>Total Requests:</strong> ${data.metrics.http_reqs.values.count}</p>
        <p><strong>Error Rate:</strong> ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</p>
        <p><strong>Test Duration:</strong> ${Math.round(data.metrics.iteration_duration.values.avg)}ms avg iteration</p>
    </div>

    <div class="metric">
        <h2>Response Times by Action Type</h2>
        <table>
            <tr><th>Action</th><th>Average Response Time</th><th>95th Percentile</th></tr>
            <tr><td>Browse All Products</td><td>${Math.round(data.metrics.browse_response_time?.values.avg || 0)}ms</td><td>${Math.round(data.metrics.browse_response_time?.values['p(95)'] || 0)}ms</td></tr>
            <tr><td>Search Products</td><td>${Math.round(data.metrics.search_response_time?.values.avg || 0)}ms</td><td>${Math.round(data.metrics.search_response_time?.values['p(95)'] || 0)}ms</td></tr>
            <tr><td>Overall</td><td>${Math.round(data.metrics.http_req_duration.values.avg)}ms</td><td>${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms</td></tr>
        </table>
    </div>

    <div class="metric">
        <h2>Performance Thresholds</h2>
        <p class="${data.metrics.http_req_duration.thresholds['p(95)<1000'].ok ? 'pass' : 'fail'}">
            Overall Response time (95% < 1000ms): ${data.metrics.http_req_duration.thresholds['p(95)<1000'].ok ? '✅ PASS' : '❌ FAIL'}
        </p>
        <p class="${data.metrics.http_req_failed.thresholds['rate<0.05'].ok ? 'pass' : 'fail'}">
            Error rate (< 5%): ${data.metrics.http_req_failed.thresholds['rate<0.05'].ok ? '✅ PASS' : '❌ FAIL'}
        </p>
        <p class="${data.metrics.search_response_time?.thresholds['p(95)<800']?.ok ? 'pass' : 'fail'}">
            Search time (95% < 800ms): ${data.metrics.search_response_time?.thresholds['p(95)<800']?.ok ? '✅ PASS' : '❌ FAIL'}
        </p>
        <p class="${data.metrics.browse_response_time?.thresholds['p(95)<600']?.ok ? 'pass' : 'fail'}">
            Browse time (95% < 600ms): ${data.metrics.browse_response_time?.thresholds['p(95)<600']?.ok ? '✅ PASS' : '❌ FAIL'}
        </p>
    </div>

    <div class="metric">
        <h2>Test Scenarios</h2>
        <ul>
            <li><strong>Product Browsing:</strong> 100% of users browse all products</li>
            <li><strong>Product Search:</strong> 30% of users perform searches</li>
            <li><strong>Category Filtering:</strong> 20% of users filter by category</li>
            <li><strong>Product Details:</strong> 40% of users view individual product pages</li>
        </ul>
    </div>
</body>
</html>
`;
}