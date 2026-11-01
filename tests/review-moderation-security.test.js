/**
 * ============================================================================
 * SUITE: Backend Authorization & Application Logic Security Suite
 * EXECUTION MODE: In-Memory Isolated Test Store (DISABLE_SUPABASE = 'true')
 * ============================================================================
 * 
 * SCOPE & PURPOSE:
 *   Validates Express route handlers, middleware access controls, session token
 *   validation, PBKDF2 credential checks, customer review validation rules,
 *   anti-privilege-escalation sanitization, and product rating recalculation
 *   algorithms in an isolated test environment.
 * 
 * IMPORTANT NOTE ON TEST BOUNDARIES:
 *   - This suite tests the Node.js application layer logic.
 *   - Because external sockets are restricted in the local environment and to
 *     prevent network timeouts, process.env.DISABLE_SUPABASE = 'true' is enabled.
 *   - This suite DOES NOT test or claim to verify live PostgreSQL database engine
 *     RLS policies directly on Supabase.
 *   - For live PostgreSQL RLS verification, see: tests/supabase-live-permissions.test.js
 * ============================================================================
 */

const test = require('node:test');
const assert = require('node:assert');
const { Readable } = require('stream');

// Disable external network calls during tests to isolate application layer logic
process.env.DISABLE_SUPABASE = 'true';

// Load Express app from backend/server.js
const app = require('../backend/server.js');

// In-memory request dispatcher that passes through Express middlewares directly via Streams
function dispatch(app, { method, url, body, headers = {} }) {
  return new Promise((resolve) => {
    const payload = body !== undefined ? Buffer.from(JSON.stringify(body)) : null;
    const req = new Readable({
      read() {
        if (payload) this.push(payload);
        this.push(null);
      }
    });
    req.method = method;
    req.url = url;
    req.headers = {};
    for (const [k, v] of Object.entries(headers)) {
      req.headers[k.toLowerCase()] = v;
    }
    if (payload) {
      req.headers['content-type'] = 'application/json';
      req.headers['content-length'] = String(payload.length);
    }

    let statusCode = 200;
    const responseHeaders = {};
    let resolved = false;

    const res = {
      statusCode: 200,
      setHeader(name, value) {
        responseHeaders[name.toLowerCase()] = value;
      },
      getHeader(name) {
        return responseHeaders[name.toLowerCase()];
      },
      status(code) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      json(data) {
        if (resolved) return;
        resolved = true;
        resolve({ status: statusCode, headers: responseHeaders, body: data });
      },
      send(data) {
        if (resolved) return;
        resolved = true;
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (_) {}
        resolve({ status: statusCode, headers: responseHeaders, body: parsed });
      },
      end(data) {
        if (resolved) return;
        resolved = true;
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (_) {}
        resolve({ status: statusCode, headers: responseHeaders, body: parsed });
      }
    };

    app(req, res);
  });
}

test('Backend Authorization & Application Logic Suite (In-Memory Isolation)', async (t) => {
  let adminToken = null;

  // Setup: Authenticate Admin using actual backend PBKDF2 credentials
  await t.test('Admin Login: PBKDF2 password verification & session token generation', async () => {
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/admin/login',
      body: { username: 'admin', password }
    });

    assert.strictEqual(res.status, 200, 'Admin login should succeed');
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, 'Should return session token');
    adminToken = res.body.token;
  });

  // 1. ANONYMOUS ACCESS RESTRICTIONS
  await t.test('1. Anonymous visitors: privileged review actions must be DENIED (401)', async () => {
    const endpoints = [
      { method: 'GET', url: '/api/admin/reviews' },
      { method: 'PUT', url: '/api/admin/reviews/REV-101/approve', body: { is_approved: true } },
      { method: 'PUT', url: '/api/admin/reviews/REV-101/feature', body: { is_featured: true } },
      { method: 'PUT', url: '/api/reviews/REV-101', body: { rating: 5 } },
      { method: 'DELETE', url: '/api/admin/reviews/REV-101' },
      { method: 'DELETE', url: '/api/reviews/REV-101' }
    ];

    for (const ep of endpoints) {
      const res = await dispatch(app, ep);
      assert.strictEqual(
        res.status,
        401,
        `Anonymous ${ep.method} ${ep.url} must return 401 Unauthorized`
      );
      assert.strictEqual(res.body.authenticated, false);
    }
  });

  await t.test('1b. Anonymous visitors: public storefront reviews only contain approved reviews', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api/reviews' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.reviews));
    for (const r of res.body.reviews) {
      assert.strictEqual(r.is_approved !== false, true, 'Public review must be approved');
    }
  });

  // 2. ORDINARY AUTHENTICATED CUSTOMER RESTRICTIONS
  await t.test('2. Ordinary customer / non-admin tokens: privileged actions must be DENIED (401)', async () => {
    const customerHeaders = {
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.customer.token'
    };

    const endpoints = [
      { method: 'GET', url: '/api/admin/reviews' },
      { method: 'PUT', url: '/api/admin/reviews/REV-101/approve', body: { is_approved: true } },
      { method: 'PUT', url: '/api/admin/reviews/REV-101/feature', body: { is_featured: true } },
      { method: 'DELETE', url: '/api/admin/reviews/REV-101' }
    ];

    for (const ep of endpoints) {
      const res = await dispatch(app, { ...ep, headers: customerHeaders });
      assert.strictEqual(
        res.status,
        401,
        `Customer token ${ep.method} ${ep.url} must return 401 Unauthorized`
      );
    }
  });

  await t.test('2b. Customer review submission: Anti-privilege-escalation enforced', async () => {
    // Attempt privilege escalation by sending is_approved: true, is_featured: true, verified_purchase: true
    const maliciousPayload = {
      customer_name: 'Malicious Customer',
      customer_phone: '9999999999',
      product_id: 'SF-TEST-PRODUCT',
      product_name: 'Test Polyhedron Jacket',
      rating: 5,
      review_title: 'Hacked 5-Star Review',
      comment: 'Attempting to self-approve review directly without admin moderation!',
      is_approved: true,
      is_featured: true,
      verified_purchase: true
    };

    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/reviews',
      body: maliciousPayload
    });

    assert.strictEqual(res.status, 201, 'Submission should succeed as pending');
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.review.is_approved, false, 'Review MUST NOT be auto-approved');
    assert.strictEqual(res.body.review.is_featured, false, 'Review MUST NOT be auto-featured');
    assert.strictEqual(res.body.review.verified_purchase, false, 'Review MUST NOT be auto-verified');
  });

  await t.test('2c. Customer review submission: Validation rules enforced', async () => {
    // Missing / too short name (< 2 chars)
    const shortNameRes = await dispatch(app, {
      method: 'POST',
      url: '/api/reviews',
      body: { customer_name: 'A', rating: 5, comment: 'Valid comment length here' }
    });
    assert.strictEqual(shortNameRes.status, 400);

    // Invalid rating (> 5)
    const badRatingRes = await dispatch(app, {
      method: 'POST',
      url: '/api/reviews',
      body: { customer_name: 'Valid Name', rating: 10, comment: 'Valid comment length here' }
    });
    assert.strictEqual(badRatingRes.status, 400);

    // Comment too short (< 8 chars)
    const shortCommentRes = await dispatch(app, {
      method: 'POST',
      url: '/api/reviews',
      body: { customer_name: 'Valid Name', rating: 4, comment: 'short' }
    });
    assert.strictEqual(shortCommentRes.status, 400);
  });

  // 3. AUTHORIZED STORE ADMINISTRATOR ACTIONS
  await t.test('3. Authorized Administrator: can view all reviews and moderate', async () => {
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Admin can get all reviews (approved + pending)
    const allReviewsRes = await dispatch(app, {
      method: 'GET',
      url: '/api/admin/reviews',
      headers: adminHeaders
    });
    assert.strictEqual(allReviewsRes.status, 200);
    assert.ok(Array.isArray(allReviewsRes.body.reviews));
  });

  // 4. PRODUCT RATING & REVIEW RECALCULATION LIFECYCLE
  await t.test('4. Product Rating Recalculation across full lifecycle (approve, reject, delete)', async () => {
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 1. Admin creates a fresh test product
    const createProdRes = await dispatch(app, {
      method: 'POST',
      url: '/api/products',
      headers: adminHeaders,
      body: {
        name: 'Sculptural Origami Parka SF-RECALC',
        category: 'Outerwear',
        price: 249,
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985',
        stock: 10
      }
    });
    assert.strictEqual(createProdRes.status, 201);
    const productId = createProdRes.body.data.id;

    // 2. Submit Review 1: 5 Stars (Pending)
    const sub1 = await dispatch(app, {
      method: 'POST',
      url: '/api/reviews',
      body: {
        customer_name: 'Tester Alpha',
        customer_phone: '9876500001',
        product_id: productId,
        product_name: 'Sculptural Origami Parka SF-RECALC',
        rating: 5,
        review_title: '5 Stars First',
        comment: 'This is the first review comment with 5 stars.'
      }
    });
    assert.strictEqual(sub1.status, 201);
    const rev1Id = sub1.body.review.review_id || sub1.body.review.id;

    // 3. Submit Review 2: 3 Stars (Pending)
    const sub2 = await dispatch(app, {
      method: 'POST',
      url: '/api/reviews',
      body: {
        customer_name: 'Tester Beta',
        customer_phone: '9876500002',
        product_id: productId,
        product_name: 'Sculptural Origami Parka SF-RECALC',
        rating: 3,
        review_title: '3 Stars Second',
        comment: 'This is the second review comment with 3 stars.'
      }
    });
    assert.strictEqual(sub2.status, 201);
    const rev2Id = sub2.body.review.review_id || sub2.body.review.id;

    // Step A: Approve Review 1 (5 stars) -> Product rating must be 5.0, count = 1
    const approve1 = await dispatch(app, {
      method: 'PUT',
      url: `/api/admin/reviews/${rev1Id}/approve`,
      headers: adminHeaders,
      body: { is_approved: true }
    });
    assert.strictEqual(approve1.status, 200);

    const prodsA = await dispatch(app, { method: 'GET', url: '/api/products' });
    const prodA = prodsA.body.data.find(p => p.id === productId);
    assert.strictEqual(prodA.rating, 5.0);
    assert.strictEqual(prodA.reviewsCount, 1);

    // Step B: Approve Review 2 (3 stars) -> Average should be (5 + 3)/2 = 4.0, count = 2
    const approve2 = await dispatch(app, {
      method: 'PUT',
      url: `/api/admin/reviews/${rev2Id}/approve`,
      headers: adminHeaders,
      body: { is_approved: true }
    });
    assert.strictEqual(approve2.status, 200);

    const prodsB = await dispatch(app, { method: 'GET', url: '/api/products' });
    const prodB = prodsB.body.data.find(p => p.id === productId);
    assert.strictEqual(prodB.rating, 4.0);
    assert.strictEqual(prodB.reviewsCount, 2);

    // Step C: Reject Review 2 -> Only Review 1 remains approved (rating = 5.0, count = 1)
    const reject2 = await dispatch(app, {
      method: 'PUT',
      url: `/api/admin/reviews/${rev2Id}/approve`,
      headers: adminHeaders,
      body: { is_approved: false }
    });
    assert.strictEqual(reject2.status, 200);

    const prodsC = await dispatch(app, { method: 'GET', url: '/api/products' });
    const prodC = prodsC.body.data.find(p => p.id === productId);
    assert.strictEqual(prodC.rating, 5.0);
    assert.strictEqual(prodC.reviewsCount, 1);

    // Step D: Delete Review 1 -> All approved reviews removed, resets to 5.0 and count = 0
    const delete1 = await dispatch(app, {
      method: 'DELETE',
      url: `/api/admin/reviews/${rev1Id}`,
      headers: adminHeaders
    });
    assert.strictEqual(delete1.status, 200);

    const prodsD = await dispatch(app, { method: 'GET', url: '/api/products' });
    const prodD = prodsD.body.data.find(p => p.id === productId);
    assert.strictEqual(prodD.rating, 5.0);
    assert.strictEqual(prodD.reviewsCount, 0);
  });
});
