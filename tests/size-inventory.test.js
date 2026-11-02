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
          let parsed = data;
          try { parsed = JSON.parse(data); } catch (e) {}
          resolve({ status: statusCode, body: parsed, headers: responseHeaders });
        }
      },
      end(data) {
        if (!resolved) {
          resolved = true;
          let parsed = data;
          try { parsed = JSON.parse(data); } catch (e) {}
          resolve({ status: statusCode, body: parsed, headers: responseHeaders });
        }
      }
    };

    app(req, res, (err) => {
      if (!resolved) {
        resolved = true;
        resolve({ status: err ? 500 : 404, body: { message: err ? err.message : 'Not Found' }, headers: {} });
      }
    });
  });
}

test('Size-wise Inventory Suite', async (t) => {
  let adminToken;
  let testProductId;

  await t.test('1. Admin logs in to manage inventory', async () => {
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/admin/login',
      body: { username: 'admin', password }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    adminToken = res.body.token;
    assert.ok(adminToken, 'Admin token should be issued');
  });

  await t.test('2. Admin publishes product with size-wise stock (XS: 40, S: 10, M: 20, L: 15, XL: 5, XXL: 0)', async () => {
    const productPayload = {
      name: 'Speedo Geometric Bomber Jacket',
      category: 'Outerwear',
      price: 1899,
      originalPrice: 2499,
      sizeStock: {
        XS: 40,
        S: 10,
        M: 20,
        L: 15,
        XL: 5,
        XXL: 0
      },
      badge: 'Limited Edition',
      tag: 'Water Repellent',
      desc: 'Precision origami cut jacket with technical weather protection.'
    };

    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/products',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: productPayload
    });

    assert.strictEqual(res.status, 201, `Failed to publish product: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.success, true);
    const prod = res.body.data;
    testProductId = prod.id;
    assert.ok(testProductId, 'Product should have an id');
    assert.strictEqual(prod.stock, 90, 'Total stock should equal 40+10+20+15+5+0 = 90');
    assert.strictEqual(prod.size_stock.XS, 40);
    assert.strictEqual(prod.size_stock.S, 10);
    assert.strictEqual(prod.size_stock.M, 20);
    assert.strictEqual(prod.size_stock.L, 15);
    assert.strictEqual(prod.size_stock.XL, 5);
    assert.strictEqual(prod.size_stock.XXL, 0);
  });

  await t.test('3. Customer buys size M: Only size M stock decreases automatically', async () => {
    const orderPayload = {
      customerName: 'Rahul Sharma',
      customerEmail: 'rahul@example.com',
      customerPhone: '+91 98765 43210',
      shippingAddress: '42 Fashion St, Bangalore, Karnataka',
      paymentMethod: 'COD',
      items: [
        {
          id: testProductId,
          name: 'Speedo Geometric Bomber Jacket',
          size: 'M',
          qty: 2,
          price: 1899
        }
      ],
      total: 3798
    };

    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/orders',
      body: orderPayload
    });

    assert.strictEqual(res.status, 201, `Order placement failed: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.success, true);

    // Verify product stock after purchase
    const prodRes = await dispatch(app, {
      method: 'GET',
      url: '/api/products'
    });
    const updatedProd = prodRes.body.data.find(p => p.id === testProductId);
    assert.ok(updatedProd, 'Product should exist in products list');
    assert.strictEqual(updatedProd.size_stock.M, 18, 'Size M should have decreased from 20 to 18');
    assert.strictEqual(updatedProd.stock, 88, 'Total stock should have decreased from 90 to 88');
    // Verify other sizes remain untouched
    assert.strictEqual(updatedProd.size_stock.XS, 40, 'Size XS should remain untouched at 40');
    assert.strictEqual(updatedProd.size_stock.S, 10, 'Size S should remain untouched at 10');
    assert.strictEqual(updatedProd.size_stock.L, 15, 'Size L should remain untouched at 15');
    assert.strictEqual(updatedProd.size_stock.XL, 5, 'Size XL should remain untouched at 5');
    assert.strictEqual(updatedProd.size_stock.XXL, 0, 'Size XXL should remain 0');
  });

  await t.test('4. Oversell Protection: Attempting to buy 50 units of size M is rejected with 400', async () => {
    const oversellOrder = {
      customerName: 'Greedy Buyer',
      customerPhone: '+91 99999 88888',
      shippingAddress: '10 Market Road',
      items: [
        {
          id: testProductId,
          name: 'Speedo Geometric Bomber Jacket',
          size: 'M',
          qty: 50, // Only 18 left
          price: 1899
        }
      ],
      total: 94950
    };

    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/orders',
      body: oversellOrder
    });

    assert.strictEqual(res.status, 400, 'Should reject order with 400 when stock is insufficient');
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'OUT_OF_STOCK');
  });

  await t.test('5. Attempting to buy unavailable size XXL (0 in stock) is rejected with 400', async () => {
    const outOfStockOrder = {
      customerName: 'XXL Customer',
      customerPhone: '+91 91234 56789',
      shippingAddress: '12 Fashion Blvd',
      items: [
        {
          id: testProductId,
          name: 'Speedo Geometric Bomber Jacket',
          size: 'XXL',
          qty: 1, // 0 left
          price: 1899
        }
      ],
      total: 1899
    };

    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/orders',
      body: outOfStockOrder
    });

    assert.strictEqual(res.status, 400, 'Should reject unavailable size with 400');
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'OUT_OF_STOCK');
  });

  await t.test('6. Customer product view: sizes with 0 quantity are completely hidden', async () => {
    const res = await dispatch(app, {
      method: 'GET',
      url: '/api/products'
    });
    assert.strictEqual(res.status, 200);
    const prod = res.body.data.find(p => p.id === testProductId);
    assert.ok(prod, 'Test product should be in products list');
    assert.strictEqual(prod.size_stock.XXL, 0, 'XXL should have 0 quantity');

    // Customer page logic:
    const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const getStockForSize = (sz) => Math.max(0, parseInt(prod.size_stock?.[sz], 10) || 0);
    const candidateSizes = Array.isArray(prod.sizes) && prod.sizes.length > 0
      ? Array.from(new Set([...prod.sizes, ...standardSizes]))
      : standardSizes;
    const displaySizes = candidateSizes.filter((sz) => getStockForSize(sz) > 0);

    assert.ok(!displaySizes.includes('XXL'), 'XXL (qty 0) must be completely hidden from customer sizes');
    assert.ok(displaySizes.includes('XS'), 'XS (qty 40) must be displayed');
    assert.ok(displaySizes.includes('S'), 'S (qty 10) must be displayed');
    assert.ok(displaySizes.includes('M'), 'M (qty 18) must be displayed');
    assert.ok(displaySizes.includes('L'), 'L (qty 15) must be displayed');
    assert.ok(displaySizes.includes('XL'), 'XL (qty 5) must be displayed');
  });
});
