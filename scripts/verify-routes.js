const http = require('http');

const tests = [
  { method: 'GET', path: '/', expect: 200 },
  { method: 'GET', path: '/health', expect: 200 },
  { method: 'GET', path: '/events', expect: 200 },
  { method: 'GET', path: '/about', expect: 200 },
  { method: 'GET', path: '/contact', expect: 200 },
  { method: 'GET', path: '/auth/login', expect: 200 },
  { method: 'GET', path: '/auth/register', expect: 200 },
  { method: 'GET', path: '/admin', expect: 302 },
  { method: 'GET', path: '/user', expect: 302 },
  { method: 'GET', path: '/nonexistent-page', expect: 404 }
];

const request = (method, path) =>
  new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port: 3000, path, method },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      }
    );
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.end();
  });

(async () => {
  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const status = await request(t.method, t.path);
      const ok = status === t.expect;
      console.log(`${ok ? '✓' : '✗'} ${t.method} ${t.path} -> ${status} (expected ${t.expect})`);
      ok ? passed++ : failed++;
    } catch (err) {
      console.log(`✗ ${t.method} ${t.path} -> ERROR: ${err.message}`);
      failed++;
    }
  }

  // Event detail from DB
  const mongoose = require('mongoose');
  require('dotenv').config();
  await mongoose.connect(process.env.MONGODB_URI);
  const Event = require('../models/Event');
  const event = await Event.findOne();
  if (event) {
    const status = await request('GET', `/events/${event._id}`);
    const ok = status === 200;
    console.log(`${ok ? '✓' : '✗'} GET /events/:id -> ${status} (expected 200)`);
    ok ? passed++ : failed++;
  }
  await mongoose.disconnect();

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
