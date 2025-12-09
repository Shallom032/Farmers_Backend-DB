import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Custom metrics for database read performance
const productListResponseTime = new Trend('product_list_time');
const productSearchResponseTime = new Trend('product_search_time');
const orderHistoryResponseTime = new Trend('order_history_time');
const farmerProductsResponseTime = new Trend('farmer_products_time');

// Test configuration for heavy read operations
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Warm up
    { duration: '2m', target: 50 },   // Moderate load
    { duration: '3m', target: 100 },  // Heavy load
    { duration: '2m', target: 100 },  // Sustained heavy load
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // DB reads should be reasonably fast
    product_list_time: ['p(95)<1000'], // Product listing should be fast
    product_search_time: ['p(95)<1200'], // Search can be a bit slower
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Simulated tokens for authenticated requests (would be obtained in setup)
const farmerToken = __ENV.FARMER_TOKEN || 'simulated-farmer-token';
const buyerToken = __ENV.BUYER_TOKEN || 'simulated-buyer-token';

export default function () {
  // Simulate heavy read operations that stress the database

  const userType = Math.random();

  if (userType < 0.4) {
    // 40% - Anonymous users browsing products (most common)
    const listStart = new Date().getTime();
    const productsResponse = http.get(`${BASE_URL}/api/products`);
    productListResponseTime.add(new Date().getTime() - listStart);

    check(productsResponse, {
      'products list: status 200': (r) => r.status === 200,
      'products list: returns array': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch {
          return false;
        }
      },
      'products list: reasonable size': (r) => r.body.length < 5 * 1024 * 1024, // < 5MB
    });

  } else if (userType < 0.7) {
    // 30% - Users searching products (complex queries)
    const searchTerms = ['tomato', 'maize', 'beans', 'potato', 'carrot', 'onion', 'cabbage'];
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const searchStart = new Date().getTime();
    const searchResponse = http.get(`${BASE_URL}/api/products/search?query=${searchTerm}`);
    productSearchResponseTime.add(new Date().getTime() - searchStart);

    check(searchResponse, {
      'product search: status 200': (r) => r.status === 200,
      'product search: returns results': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data);
        } catch {
          return false;
        }
      },
    });

  } else {
    // 30% - Authenticated users accessing personalized data
    const headers = {
      'Authorization': `Bearer ${Math.random() < 0.5 ? buyerToken : farmerToken}`,
      'Content-Type': 'application/json',
    };

    if (Math.random() < 0.6) {
      // Buyers checking order history
      const orderStart = new Date().getTime();
      const ordersResponse = http.get(`${BASE_URL}/api/orders/my/orders`, { headers });
      orderHistoryResponseTime.add(new Date().getTime() - orderStart);

      check(ordersResponse, {
        'order history: status 200': (r) => r.status === 200,
        'order history: returns orders': (r) => {
          try {
            const data = JSON.parse(r.body);
            return Array.isArray(data);
          } catch {
            return false;
          }
        },
      });
    } else {
      // Farmers checking their products
      const farmerStart = new Date().getTime();
      const farmerProductsResponse = http.get(`${BASE_URL}/api/products/my/products`, { headers });
      farmerProductsResponseTime.add(new Date().getTime() - farmerStart);

      check(farmerProductsResponse, {
        'farmer products: status 200': (r) => r.status === 200,
        'farmer products: returns products': (r) => {
          try {
            const data = JSON.parse(r.body);
            return Array.isArray(data);
          } catch {
            return false;
          }
        },
      });
    }
  }

  // Simulate user think time
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

// Setup function - prepare test data
export function setup() {
  console.log('Setting up heavy read queries performance test...');
  console.log('This test focuses on database read performance under load');

  // In a real scenario, you would:
  // 1. Create test users and obtain real JWT tokens
  // 2. Create test products, orders, etc.
  // 3. Set up the database with sufficient test data

  console.log('Heavy read queries test setup complete');
}

// Handle summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'db-read-performance-report.json': JSON.stringify(data, null, 2),
    'db-read-performance-report.html': htmlReport(data),
  };
}

function textSummary(data, options) {
  return `
📖 Heavy Read Queries Performance Test Summary
================================================

Test Duration: ${Math.round(data.metrics.iteration_duration.values.avg)}ms avg iteration
Total Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%

Database Read Performance:
  - Product Listing: ${Math.round(data.metrics.product_list_time?.values.avg || 0)}ms avg
  - Product Search: ${Math.round(data.metrics.product_search_time?.values.avg || 0)}ms avg
  - Order History: ${Math.round(data.metrics.order_history_time?.values.avg || 0)}ms avg
  - Farmer Products: ${Math.round(data.metrics.farmer_products_time?.values.avg || 0)}ms avg
  - Overall Average: ${Math.round(data.metrics.http_req_duration.values.avg)}ms

Response Time Percentiles:
  - 50th percentile: ${Math.round(data.metrics.http_req_duration.values['p(50)'])}ms
  - 95th percentile: ${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms
  - 99th percentile: ${Math.round(data.metrics.http_req_duration.values['p(99)'])}ms

Query Type Distribution:
  - Anonymous Product Browsing: ~40% of requests
  - Product Search Operations: ~30% of requests
  - Authenticated Data Access: ~30% of requests

Thresholds:
  - Overall Response time (95% < 1500ms): ${data.metrics.http_req_duration.thresholds['p(95)<1500'].ok ? '✅ PASS' : '❌ FAIL'}
  - Product list time (95% < 1000ms): ${data.metrics.product_list_time?.thresholds['p(95)<1000']?.ok ? '✅ PASS' : '❌ FAIL'}
  - Search time (95% < 1200ms): ${data.metrics.product_search_time?.thresholds['p(95)<1200']?.ok ? '✅ PASS' : '❌ FAIL'}
`;
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Heavy Read Queries Performance Test Report</title>
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
    <h1>📖 Heavy Read Queries Performance Test Report</h1>

    <div class="metric">
        <h2>Test Overview</h2>
        <p><strong>Total Requests:</strong> ${data.metrics.http_reqs.values.count}</p>
        <p><strong>Error Rate:</strong> ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</p>
        <p><strong>Test Duration:</strong> ${Math.round(data.metrics.iteration_duration.values.avg)}ms avg iteration</p>
    </div>

    <div class="metric">
        <h2>Database Read Performance by Query Type</h2>
        <table>
            <tr><th>Query Type</th><th>Average Response Time</th><th>95th Percentile</th><th>Request Count</th></tr>
            <tr><td>Product Listing (Anonymous)</td><td>${Math.round(data.metrics.product_list_time?.values.avg || 0)}ms</td><td>${Math.round(data.metrics.product_list_time?.values['p(95)'] || 0)}ms</td><td>~40%</td></tr>
            <tr><td>Product Search</td><td>${Math.round(data.metrics.product_search_time?.values.avg || 0)}ms</td><td>${Math.round(data.metrics.product_search_time?.values['p(95)'] || 0)}ms</td><td>~30%</td></tr>
            <tr><td>Order History (Authenticated)</td><td>${Math.round(data.metrics.order_history_time?.values.avg || 0)}ms</td><td>${Math.round(data.metrics.order_history_time?.values.avg || 0)}ms</td><td>~18%</td></tr>
            <tr><td>Farmer Products (Authenticated)</td><td>${Math.round(data.metrics.farmer_products_time?.values.avg || 0)}ms</td><td>${Math.round(data.metrics.farmer_products_time?.values['p(95)'] || 0)}ms</td><td>~12%</td></tr>
        </table>
    </div>

    <div class="metric">
        <h2>Overall Response Time Distribution</h2>
        <table>
            <tr><th>Percentile</th><th>Response Time</th></tr>
            <tr><td>50th (Median)</td><td>${Math.round(data.metrics.http_req_duration.values['p(50)'])}ms</td></tr>
            <tr><td>95th</td><td>${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms</td></tr>
            <tr><td>99th</td><td>${Math.round(data.metrics.http_req_duration.values['p(99)'])}ms</td></tr>
        </table>
    </div>

    <div class="metric">
        <h2>Performance Thresholds</h2>
        <p class="${data.metrics.http_req_duration.thresholds['p(95)<1500'].ok ? 'pass' : 'fail'}">
            Overall Response time (95% < 1500ms): ${data.metrics.http_req_duration.thresholds['p(95)<1500'].ok ? '✅ PASS' : '❌ FAIL'}
        </p>
        <p class="${data.metrics.product_list_time?.thresholds['p(95)<1000']?.ok ? 'pass' : 'fail'}">
            Product list time (95% < 1000ms): ${data.metrics.product_list_time?.thresholds['p(95)<1000']?.ok ? '✅ PASS' : '❌ FAIL'}
        </p>
        <p class="${data.metrics.product_search_time?.thresholds['p(95)<1200']?.ok ? 'pass' : 'fail'}">
            Search time (95% < 1200ms): ${data.metrics.product_search_time?.thresholds['p(95)<1200']?.ok ? '✅ PASS' : '❌ FAIL'}
        </p>
    </div>

    <div class="metric">
        <h2>Database Performance Insights</h2>
        <ul>
            <li><strong>Indexing:</strong> Check if product search queries are properly indexed</li>
            <li><strong>Query Optimization:</strong> Complex joins in order history may need optimization</li>
            <li><strong>Caching:</strong> Consider caching frequently accessed product data</li>
            <li><strong>Connection Pooling:</strong> Ensure database connection pool is properly configured</li>
        </ul>
    </div>
</body>
</html>
`;
}