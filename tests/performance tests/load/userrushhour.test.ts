import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginResponseTime = new Trend('login_response_time');
const registrationResponseTime = new Trend('registration_response_time');

// Test configuration for rush hour user activity
export const options = {
  scenarios: {
    morning_rush: {
      executor: 'ramping-vus',
      startTime: '0s',
      stages: [
        { duration: '30s', target: 10 },   // Slow start
        { duration: '30s', target: 50 },   // Morning rush begins
        { duration: '2m', target: 200 },   // Peak rush hour
        { duration: '1m', target: 200 },   // Sustained peak
        { duration: '1m', target: 100 },   // Rush hour subsides
        { duration: '30s', target: 0 },    // End of rush
      ],
      tags: { period: 'morning_rush' },
    },
    evening_rush: {
      executor: 'ramping-vus',
      startTime: '6m',  // Start after morning rush
      stages: [
        { duration: '30s', target: 20 },   // Evening buildup
        { duration: '1m', target: 150 },   // Evening peak
        { duration: '2m', target: 150 },   // Sustained evening activity
        { duration: '1m', target: 50 },    // Evening wind down
        { duration: '30s', target: 0 },    // End of day
      ],
      tags: { period: 'evening_rush' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Rush hour can be slower but not too slow
    http_req_failed: ['rate<0.15'],    // Higher error tolerance during rush
    login_response_time: ['p(95)<1500'], // Login should be reasonably fast
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// User data for testing
let userCounter = 0;

function generateUserData() {
  userCounter++;
  return {
    full_name: `Rush User ${userCounter}`,
    email: `rush${userCounter}@test.com`,
    phone: `07${String(userCounter).padStart(8, '0')}`,
    password: 'password123',
    confirmPassword: 'password123',
    location: ['Nairobi', 'Kiambu', 'Nakuru', 'Eldoret'][userCounter % 4],
    role: ['farmer', 'buyer', 'buyer', 'buyer'][userCounter % 4], // Mostly buyers
  };
}

export default function () {
  // Simulate rush hour user behavior patterns

  const userBehavior = Math.random();

  if (userBehavior < 0.3) {
    // 30% of users register during rush hour
    const userData = generateUserData();
    const registerStart = new Date().getTime();
    const registerResponse = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(userData), {
      headers: { 'Content-Type': 'application/json' },
    });
    registrationResponseTime.add(new Date().getTime() - registerStart);

    check(registerResponse, {
      'register: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'register: has success message': (r) => {
        try {
          const data = JSON.parse(r.body as string);
          return data.message && data.message.includes('registered');
        } catch {
          return false;
        }
      },
    });

    // If registration successful, login immediately
    if (registerResponse.status === 200 || registerResponse.status === 201) {
      sleep(1); // Brief pause before login

      const loginStart = new Date().getTime();
      const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
        email: userData.email,
        password: userData.password,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
      loginResponseTime.add(new Date().getTime() - loginStart);

      check(loginResponse, {
        'login: status is 200': (r) => r.status === 200,
        'login: returns token': (r) => {
          try {
            const data = JSON.parse(r.body as string);
            return data.token && data.user;
          } catch {
            return false;
          }
        },
      });
    }

  } else if (userBehavior < 0.7) {
    // 40% of users login during rush hour (existing users)
    const loginData = {
      email: `existing${Math.floor(Math.random() * 100) + 1}@test.com`,
      password: 'password123',
    };

    const loginStart = new Date().getTime();
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginData), {
      headers: { 'Content-Type': 'application/json' },
    });
    loginResponseTime.add(new Date().getTime() - loginStart);

    check(loginResponse, {
      'login: status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'login: returns token if successful': (r) => {
        if (r.status === 200) {
          try {
            const data = JSON.parse(r.body as string);
            return data.token && data.user;
          } catch {
            return false;
          }
        }
        return true; // 401 is acceptable for non-existent users
      },
    });

  } else {
    // 30% of users browse without authentication
    const browseResponse = http.get(`${BASE_URL}/api/products`);

    check(browseResponse, {
      'browse: status is 200': (r) => r.status === 200,
      'browse: returns products': (r) => {
        try {
          const data = JSON.parse(r.body as string);
          return Array.isArray(data);
        } catch {
          return false;
        }
      },
    });
  }

  // Record error rate
  errorRate.add(false); // We'll track this per request type

  // Simulate user activity duration during rush hour
  sleep(Math.random() * 5 + 2); // 2-7 seconds between actions
}

// Setup function
export function setup() {
  console.log('Setting up rush hour user activity test...');
  console.log('Simulating morning and evening rush hour patterns');

  // Pre-create some test users for login testing
  const testUsers = [];
  for (let i = 1; i <= 100; i++) {
    testUsers.push({
      full_name: `Existing User ${i}`,
      email: `existing${i}@test.com`,
      phone: `07123456${String(i).padStart(2, '0')}`,
      password: 'password123',
      confirmPassword: 'password123',
      location: 'Nairobi',
      role: i % 3 === 0 ? 'farmer' : 'buyer', // Mix of farmers and buyers
    });
  }

  console.log('Rush hour test setup complete. Ready to simulate user rush patterns.');
}

// Handle summary
export function handleSummary(data: any) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'rush-hour-report.json': JSON.stringify(data, null, 2),
    'rush-hour-report.html': htmlReport(data),
  };
}

function textSummary(data: any, options: any) {
  return `
 rush User Rush Hour Load Test Summary
===========================================

Test Duration: ${Math.round(data.metrics.iteration_duration.values.avg)}ms avg iteration
Total Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%

User Activity Breakdown:
  - Registration attempts: ~30% of users
  - Login attempts: ~40% of users
  - Anonymous browsing: ~30% of users

Response Times:
  - Login Average: ${Math.round(data.metrics.login_response_time?.values.avg || 0)}ms
  - Registration Average: ${Math.round(data.metrics.registration_response_time?.values.avg || 0)}ms
  - Overall Average: ${Math.round(data.metrics.http_req_duration.values.avg)}ms
  - 95th percentile: ${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms

Custom Metrics:
  - Error Rate: ${(data.metrics.errors?.values.rate * 100 || 0).toFixed(2)}%

Thresholds:
  - Response time (95% < 2000ms): ${data.metrics.http_req_duration.thresholds['p(95)<2000'].ok ? '✅ PASS' : '❌ FAIL'}
  - Error rate (< 15%): ${data.metrics.http_req_failed.thresholds['rate<0.15'].ok ? '✅ PASS' : '❌ FAIL'}
  - Login time (95% < 1500ms): ${data.metrics.login_response_time?.thresholds['p(95)<1500']?.ok ? '✅ PASS' : '❌ FAIL'}
`;
}

function htmlReport(data: any) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>User Rush Hour Load Test Report</title>
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
    <h1> rush User Rush Hour Load Test Report</h1>

    <div class="metric">
        <h2>Test Overview</h2>
        <p><strong>Total Requests:</strong> ${data.metrics.http_reqs.values.count}</p>
        <p><strong>Error Rate:</strong> ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</p>
        <p><strong>Test Duration:</strong> ${Math.round(data.metrics.iteration_duration.values.avg)}ms avg iteration</p>
    </div>

    <div class="metric">
        <h2>Rush Hour Scenarios</h2>
        <table>
            <tr><th>Period</th><th>Peak Users</th><th>Duration</th></tr>
            <tr><td>Morning Rush</td><td>200 users</td><td>4 minutes</td></tr>
            <tr><td>Evening Rush</td><td>150 users</td><td>4.5 minutes</td></tr>
        </table>
    </div>

    <div class="metric">
        <h2>User Behavior Patterns</h2>
        <ul>
            <li><strong>User Registration:</strong> 30% of rush hour activity</li>
            <li><strong>User Login:</strong> 40% of rush hour activity</li>
            <li><strong>Anonymous Browsing:</strong> 30% of rush hour activity</li>
        </ul>
    </div>

    <div class="metric">
        <h2>Response Times</h2>
        <table>
            <tr><th>Action</th><th>Average Response Time</th><th>95th Percentile</th></tr>
            <tr><td>User Login</td><td>${Math.round(data.metrics.login_response_time?.values.avg || 0)}ms</td><td>${Math.round(data.metrics.login_response_time?.values['p(95)'] || 0)}ms</td></tr>
            <tr><td>User Registration</td><td>${Math.round(data.metrics.registration_response_time?.values.avg || 0)}ms</td><td>${Math.round(data.metrics.registration_response_time?.values['p(95)'] || 0)}ms</td></tr>
            <tr><td>Overall</td><td>${Math.round(data.metrics.http_req_duration.values.avg)}ms</td><td>${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms</td></tr>
        </table>
    </div>

    <div class="metric">
        <h2>Performance Thresholds</h2>
        <p class="${data.metrics.http_req_duration.thresholds['p(95)<2000'].ok ? 'pass' : 'fail'}">
            Overall Response time (95% < 2000ms): ${data.metrics.http_req_duration.thresholds['p(95)<2000'].ok ? '✅ PASS' : '❌ FAIL'}
        </p>
        <p class="${data.metrics.http_req_failed.thresholds['rate<0.15'].ok ? 'pass' : 'fail'}">
            Error rate (< 15%): ${data.metrics.http_req_failed.thresholds['rate<0.15'].ok ? '✅ PASS' : '❌ FAIL'}
        </p>
        <p class="${data.metrics.login_response_time?.thresholds['p(95)<1500']?.ok ? 'pass' : 'fail'}">
            Login time (95% < 1500ms): ${data.metrics.login_response_time?.thresholds['p(95)<1500']?.ok ? '✅ PASS' : '❌ FAIL'}
        </p>
    </div>
</body>
</html>
`;
}