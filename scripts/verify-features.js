/**
 * Comprehensive feature verification script
 */
require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE = process.env.APP_URL || 'http://localhost:3000';

class CookieJar {
  constructor() {
    this.cookies = {};
  }
  store(setCookieHeaders) {
    if (!setCookieHeaders) return;
    const list = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    list.forEach((c) => {
      const [pair] = c.split(';');
      const [k, v] = pair.split('=');
      if (k && v) this.cookies[k.trim()] = v.trim();
    });
  }
  header() {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

const request = (method, path, { jar, body, headers = {}, followRedirect = false } = {}) =>
  new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const lib = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: { ...headers }
    };
    if (jar && jar.header()) opts.headers.Cookie = jar.header();

    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (jar) jar.store(res.headers['set-cookie']);
        resolve({ status: res.statusCode, headers: res.headers, body: data, url: url.href });
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Timeout: ${method} ${path}`));
    });
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        const encoded = new URLSearchParams(body).toString();
        opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.write(encoded);
      }
    }
    req.end();
  });

const results = [];

const test = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.log(`✗ ${name}: ${err.message}`);
  }
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

(async () => {
  console.log(`Testing ${BASE}\n`);

  // Public routes
  await test('Home page loads', async () => {
    const r = await request('GET', '/');
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.includes('EventHub') || r.body.includes('Discover'), 'missing home content');
  });

  await test('Events list loads', async () => {
    const r = await request('GET', '/events');
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.includes('Browse Events') || r.body.includes('event-card'), 'missing events');
  });

  await test('Event search/filter', async () => {
    const r = await request('GET', '/events?category=technology&search=Dev');
    assert(r.status === 200, `status ${r.status}`);
  });

  await test('About & Contact pages', async () => {
    const a = await request('GET', '/about');
    const c = await request('GET', '/contact');
    assert(a.status === 200 && c.status === 200, 'pages failed');
  });

  await test('404 page', async () => {
    const r = await request('GET', '/does-not-exist-xyz');
    assert(r.status === 404, `status ${r.status}`);
  });

  // Get event ID
  let eventId = null;
  let freeEventId = null;
  await test('Event detail page', async () => {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const Event = require('../models/Event');
    const event = await Event.findOne({ status: 'published' });
    const freeEvent = await Event.findOne({ status: 'published', ticketPrice: 0 });
    assert(event, 'no events in DB - run npm run seed');
    eventId = event._id.toString();
    if (freeEvent) freeEventId = freeEvent._id.toString();
    const r = await request('GET', `/events/${eventId}`);
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.includes(event.title), 'title not in page');
    await mongoose.disconnect();
  });

  // Auth - protected redirect
  await test('Protected routes redirect when logged out', async () => {
    const r = await request('GET', '/user');
    assert(r.status === 302, `status ${r.status}`);
    assert(r.headers.location === '/auth/login', `redirect to ${r.headers.location}`);
  });

  // Register new user
  const uniqueEmail = `test${Date.now()}@test.com`;
  const jar = new CookieJar();

  await test('User registration', async () => {
    const r = await request('POST', '/auth/register', {
      jar,
      body: {
        firstName: 'Test',
        lastName: 'User',
        email: uniqueEmail,
        password: 'test1234',
        confirmPassword: 'test1234',
        role: 'attendee'
      }
    });
    assert(r.status === 302, `status ${r.status}, body: ${r.body.slice(0, 200)}`);
    assert(r.headers.location === '/', `redirect to ${r.headers.location}`);
  });

  await test('User dashboard after login', async () => {
    const r = await request('GET', '/user', { jar });
    assert(r.status === 200, `status ${r.status}`);
  });

  await test('Profile page loads', async () => {
    const r = await request('GET', '/user/profile', { jar });
    assert(r.status === 200, `status ${r.status}`);
  });

  await test('Profile update', async () => {
    const r = await request('POST', '/user/profile?_method=PUT', {
      jar,
      body: { firstName: 'TestUpdated', lastName: 'User', phone: '9876543210', bio: 'Test bio', _redirect: '/user/profile' }
    });
    assert(r.status === 302, `status ${r.status}`);
    const p = await request('GET', '/user/profile', { jar });
    assert(p.body.includes('TestUpdated'), 'profile not updated');
  });

  // Free event booking
  if (freeEventId) {
    await test('Free event registration', async () => {
      const r = await request('POST', `/bookings/events/${freeEventId}`, { jar });
      assert(r.status === 302, `status ${r.status}, loc: ${r.headers.location}`);
      const b = await request('GET', '/user/bookings', { jar });
      assert(b.status === 200, `bookings page ${b.status}`);
      assert(b.body.includes('TKT-') || b.body.includes('confirmed'), 'no booking found');
    });

    await test('Duplicate registration blocked', async () => {
      const r = await request('POST', `/bookings/events/${freeEventId}`, { jar });
      assert(r.status === 302, `status ${r.status}`);
    });
  }

  // Admin login
  const adminJar = new CookieJar();
  await test('Admin login', async () => {
    const r = await request('POST', '/auth/login', {
      jar: adminJar,
      body: { email: 'admin@eventhub.com', password: 'admin123' }
    });
    assert(r.status === 302, `status ${r.status}`);
  });

  await test('Admin dashboard', async () => {
    const r = await request('GET', '/admin', { jar: adminJar });
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.includes('Total Users') || r.body.includes('totalUsers'), 'missing admin stats');
  });

  await test('Admin users page', async () => {
    const r = await request('GET', '/admin/users', { jar: adminJar });
    assert(r.status === 200, `status ${r.status}`);
  });

  await test('Admin events page', async () => {
    const r = await request('GET', '/admin/events', { jar: adminJar });
    assert(r.status === 200, `status ${r.status}`);
  });

  await test('Admin registrations page', async () => {
    const r = await request('GET', '/admin/registrations', { jar: adminJar });
    assert(r.status === 200, `status ${r.status}`);
  });

  // Organizer login
  const orgJar = new CookieJar();
  await test('Organizer login', async () => {
    const r = await request('POST', '/auth/login', {
      jar: orgJar,
      body: { email: 'priya@organizer.com', password: 'organizer123' }
    });
    assert(r.status === 302, `status ${r.status}`);
  });

  await test('Organizer dashboard', async () => {
    const r = await request('GET', '/organizer', { jar: orgJar });
    assert(r.status === 200, `status ${r.status}`);
  });

  await test('Organizer create event form', async () => {
    const r = await request('GET', '/events/new', { jar: orgJar });
    assert(r.status === 200, `status ${r.status}`);
  });

  await test('Organizer create event', async () => {
    const start = new Date();
    start.setDate(start.getDate() + 30);
    const end = new Date(start);
    end.setHours(end.getHours() + 4);
    const fmt = (d) => d.toISOString().slice(0, 16);
    const r = await request('POST', '/events', {
      jar: orgJar,
      body: {
        title: 'Test Event Auto',
        description: 'Automated test event description for verification.',
        category: 'technology',
        venue: 'Test Venue',
        city: 'Bangalore',
        address: '123 Test St',
        startDate: fmt(start),
        endDate: fmt(end),
        capacity: '50',
        ticketPrice: '0',
        status: 'published',
        tags: 'test, auto',
        _redirect: '/events/new'
      }
    });
    assert(r.status === 302, `status ${r.status}, body: ${r.body.slice(0, 300)}`);
    assert(r.headers.location && r.headers.location.includes('/events/'), `redirect ${r.headers.location}`);
  });

  await test('Organizer events list', async () => {
    const r = await request('GET', '/organizer/events', { jar: orgJar });
    assert(r.status === 200, `status ${r.status}`);
  });

  await test('Organizer revenue page', async () => {
    const r = await request('GET', '/organizer/revenue', { jar: orgJar });
    assert(r.status === 200, `status ${r.status}`);
  });

  // Attendee cannot access organizer-only
  await test('Attendee blocked from admin', async () => {
    const r = await request('GET', '/admin', { jar });
    assert(r.status === 302, `status ${r.status}`);
  });

  await test('Attendee blocked from create event', async () => {
    const r = await request('GET', '/events/new', { jar });
    assert(r.status === 302, `status ${r.status}`);
  });

  await test('Invalid event ID handled gracefully', async () => {
    const r = await request('GET', '/events/notavalidid123');
    assert(r.status === 302 || r.status === 404, `status ${r.status}`);
  });

  await test('Edit event requires login', async () => {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const Event = require('../models/Event');
    const event = await Event.findOne();
    await mongoose.disconnect();
    const r = await request('GET', `/events/${event._id}/edit`);
    assert(r.status === 302, `status ${r.status}`);
    assert(r.headers.location === '/auth/login', 'should redirect to login');
  });

  await test('Mock payment flow', async () => {
    const loginJar = new CookieJar();
    await request('POST', '/auth/login', {
      jar: loginJar,
      body: { email: 'attendee@eventhub.com', password: 'attendee123' }
    });
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const Event = require('../models/Event');
    const Booking = require('../models/Booking');
    const paid = await Event.findOne({ status: 'published', ticketPrice: { $gt: 0 } });
    await Booking.deleteMany({ user: (await require('../models/User').findOne({ email: 'attendee@eventhub.com' }))._id, event: paid._id });
    await mongoose.disconnect();

    const orderRes = await request('POST', `/payments/create-order/${paid._id}`, { jar: loginJar });
    assert(orderRes.status === 200, `create order ${orderRes.status}: ${orderRes.body}`);
    const orderData = JSON.parse(orderRes.body);
    assert(orderData.success && orderData.mock, 'mock order not created');

    const payRes = await request('POST', '/payments/mock-pay', {
      jar: loginJar,
      body: { paymentId: orderData.paymentId }
    });
    assert(payRes.status === 302, `mock pay ${payRes.status}`);
    assert(payRes.headers.location.includes('/payments/success/'), 'should redirect to success');
  });

  await test('Booking detail page', async () => {
    const loginJar = new CookieJar();
    await request('POST', '/auth/login', {
      jar: loginJar,
      body: { email: 'attendee@eventhub.com', password: 'attendee123' }
    });
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const Booking = require('../models/Booking');
    const User = require('../models/User');
    const user = await User.findOne({ email: 'attendee@eventhub.com' });
    const booking = await Booking.findOne({ user: user._id, status: 'confirmed' });
    await mongoose.disconnect();
    if (!booking) throw new Error('no booking for detail test');
    const r = await request('GET', `/bookings/${booking._id}`, { jar: loginJar });
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.includes(booking.ticketNumber), 'ticket not shown');
  });

  // Contact form
  await test('Contact form submission', async () => {
    const r = await request('POST', '/contact', {
      body: { name: 'Test', email: 'test@test.com', message: 'Hello test message', _redirect: '/contact' }
    });
    assert(r.status === 302, `status ${r.status}`);
  });

  // Logout
  await test('Logout works', async () => {
    const r = await request('GET', '/auth/logout', { jar });
    assert(r.status === 302, `status ${r.status}`);
    const u = await request('GET', '/user', { jar });
    assert(u.status === 302, 'still logged in after logout');
  });

  // Paid event checkout page
  let paidEventId = null;
  await test('Payment checkout page (logged in)', async () => {
    const loginJar = new CookieJar();
    await request('POST', '/auth/login', {
      jar: loginJar,
      body: { email: 'attendee@eventhub.com', password: 'attendee123' }
    });
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const Event = require('../models/Event');
    const paid = await Event.findOne({ status: 'published', ticketPrice: { $gt: 0 } });
    await mongoose.disconnect();
    if (!paid) throw new Error('no paid event found');
    paidEventId = paid._id.toString();
    const r = await request('GET', `/payments/checkout/${paidEventId}`, { jar: loginJar });
    assert(r.status === 200, `status ${r.status}`);
    assert(r.body.includes('Razorpay') || r.body.includes('Checkout'), 'checkout page missing');
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('\nFailed tests:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
    process.exit(1);
  }
})();
