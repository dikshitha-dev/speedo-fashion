const test = require('node:test');
const assert = require('node:assert');
const { Readable } = require('stream');

process.env.DISABLE_SUPABASE = 'true';
const app = require('../backend/server.js');

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
        res.statusCode = code;
        return res;
      },
      json(data) {
        if (!resolved) {
          resolved = true;
          resolve({ status: statusCode, body: data, headers: responseHeaders });
        }
      },
      send(data) {
        if (!resolved) {
          resolved = true;
          resolve({ status: statusCode, body: data, headers: responseHeaders });
        }
      },
      end() {
        if (!resolved) {
          resolved = true;
          resolve({ status: statusCode, body: null, headers: responseHeaders });
        }
      }
    };

    app(req, res);
  });
}

test('Customer Authentication & Security Architecture Suite', async (t) => {
  let customerAToken = '';
  let customerBToken = '';
  let adminToken = '';

  const customerAPhone = '9876543210';
  const customerBPhone = '9123456780';

  await t.test('1. Customer A registers/authenticates via POST /api/customer/auth', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/customer/auth',
      body: {
        name: 'Rahul Sharma',
        phone: customerAPhone
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, 'Must return a customer session token');
    assert.strictEqual(res.body.customer.phone, customerAPhone);
    assert.strictEqual(res.body.customer.name, 'Rahul Sharma');
    customerAToken = res.body.token;
  });

  await t.test('2. Customer B registers/authenticates via POST /api/customer/auth', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/customer/auth',
      body: {
        name: 'Priya Patel',
        phone: customerBPhone
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, 'Must return a customer session token');
    assert.strictEqual(res.body.customer.phone, customerBPhone);
    customerBToken = res.body.token;
  });

  await t.test('3. Unauthenticated access to /api/customer/:phone returns 401 Unauthorized', async () => {
    const res = await dispatch(app, {
      method: 'GET',
      url: `/api/customer/${customerAPhone}`
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.code, 'UNAUTHORIZED');
  });

  await t.test('4. Customer A can access their own profile via GET /api/customer/9876543210', async () => {
    const res = await dispatch(app, {
      method: 'GET',
      url: `/api/customer/${customerAPhone}`,
      headers: {
        'Authorization': `Bearer ${customerAToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.customer.phone, customerAPhone);
    assert.strictEqual(res.body.customer.name, 'Rahul Sharma');
  });

  await t.test('5. Customer A accessing Customer B profile returns 403 Forbidden (Ownership Isolation)', async () => {
    const res = await dispatch(app, {
      method: 'GET',
      url: `/api/customer/${customerBPhone}`,
      headers: {
        'Authorization': `Bearer ${customerAToken}`
      }
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, 'FORBIDDEN');
  });

  await t.test('6. Customer A can update their own saved address via PUT /api/customer/profile', async () => {
    const res = await dispatch(app, {
      method: 'PUT',
      url: '/api/customer/profile',
      headers: {
        'Authorization': `Bearer ${customerAToken}`
      },
      body: {
        phone: customerAPhone,
        saved_address: '42 Marine Lines, Penthouse 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400020'
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.customer.saved_address, '42 Marine Lines, Penthouse 4B');
    assert.strictEqual(res.body.customer.city, 'Mumbai');
  });

  await t.test('7. Customer A attempting to update Customer B address returns 403 Forbidden', async () => {
    const res = await dispatch(app, {
      method: 'PUT',
      url: '/api/customer/profile',
      headers: {
        'Authorization': `Bearer ${customerAToken}`
      },
      body: {
        phone: customerBPhone,
        saved_address: 'Malicious Address Modification Attempt'
      }
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, 'FORBIDDEN');
  });

  await t.test('8. Customer A attempting to access Customer B orders returns 403 Forbidden', async () => {
    const res = await dispatch(app, {
      method: 'GET',
      url: `/api/customer/orders/${customerBPhone}`,
      headers: {
        'Authorization': `Bearer ${customerAToken}`
      }
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, 'FORBIDDEN');
  });

  await t.test('9. Customer A can view their own orders via GET /api/customer/orders/9876543210', async () => {
    const res = await dispatch(app, {
      method: 'GET',
      url: `/api/customer/orders/${customerAPhone}`,
      headers: {
        'Authorization': `Bearer ${customerAToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.orders));
  });

  await t.test('10. Admin authentication allows managing all customer records', async () => {
    // 10a. Admin login
    const adminLoginRes = await dispatch(app, {
      method: 'POST',
      url: '/api/admin/login',
      body: {
        username: process.env.ADMIN_USERNAME || 'speedo_admin',
        password: process.env.ADMIN_PASSWORD || 'speedo_secure_pass_2026'
      }
    });

    assert.strictEqual(adminLoginRes.status, 200);
    adminToken = adminLoginRes.body.token;
    assert.ok(adminToken, 'Admin token should be generated');

    // 10b. Admin can list all customers
    const listRes = await dispatch(app, {
      method: 'GET',
      url: '/api/admin/customers',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.success, true);
    assert.ok(listRes.body.count >= 2);

    // 10c. Admin can inspect any customer profile (Customer B)
    const viewCustRes = await dispatch(app, {
      method: 'GET',
      url: `/api/customer/${customerBPhone}`,
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(viewCustRes.status, 200);
    assert.strictEqual(viewCustRes.body.customer.phone, customerBPhone);

    // 10d. Admin can update any customer record via /api/admin/customers/:phone
    const updateRes = await dispatch(app, {
      method: 'PUT',
      url: `/api/admin/customers/${customerBPhone}`,
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        notes: 'VIP Customer verified by admin'
      }
    });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.success, true);
  });

  await t.test('11. Unauthenticated request to /api/admin/customers returns 401 Unauthorized', async () => {
    const res = await dispatch(app, {
      method: 'GET',
      url: '/api/admin/customers'
    });

    assert.strictEqual(res.status, 401);
  });

  await t.test('12. Validation: invalid mobile numbers (< 10 digits) are rejected with 400', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/customer/auth',
      body: {
        name: 'Invalid Test',
        phone: '12345'
      }
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });
});
