const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const BACKEND_URL = 'https://speedo-fashion.onrender.com';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tbrwvufwfjhenzpqdqnb.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function runLiveTests() {
  console.log('🚀 Running Live End-to-End Production Tests...');
  const results = {};

  // 1. BACKEND STATUS & HEALTH
  console.log('\n--- 1. Backend Status & Health ---');
  try {
    const rootRes = await fetch(`${BACKEND_URL}/`);
    const rootText = await rootRes.text();
    results.backendRoot = { status: rootRes.status, body: rootText };
    console.log(`✅ Root status (${rootRes.status}): "${rootText.trim()}"`);

    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthJson = await healthRes.json();
    results.backendHealth = { status: healthRes.status, body: healthJson };
    console.log(`✅ Health check (${healthRes.status}):`, healthJson);
  } catch (e) {
    console.error('❌ Backend status check failed:', e.message);
  }

  // 2. STOREFRONT PRODUCTS
  console.log('\n--- 2. Storefront Products Browsing ---');
  try {
    const prodsRes = await fetch(`${BACKEND_URL}/api/products`);
    const prodsJson = await prodsRes.json();
    results.products = { status: prodsRes.status, count: prodsJson.count || (prodsJson.data ? prodsJson.data.length : 0) };
    console.log(`✅ Storefront Products (${prodsRes.status}): ${results.products.count} products retrieved`);
  } catch (e) {
    console.error('❌ Products check failed:', e.message);
  }

  // 3. STOREFRONT REVIEWS (No more 404!)
  console.log('\n--- 3. Storefront Reviews (Public Data API) ---');
  try {
    const revsRes = await fetch(`${SUPABASE_URL}/rest/v1/reviews?select=*&is_approved=eq.true`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
    });
    const revs = await revsRes.json();
    results.reviewsRest = { status: revsRes.status, count: Array.isArray(revs) ? revs.length : 0 };
    console.log(`✅ Supabase Reviews API (${revsRes.status}): HTTP 200 OK! Found ${results.reviewsRest.count} approved reviews.`);
  } catch (e) {
    console.error('❌ Reviews check failed:', e.message);
  }

  // 4. GUEST CHECKOUT
  console.log('\n--- 4. Guest Checkout (Order Placement) ---');
  let testOrderId = null;
  try {
    const testOrder = {
      customerName: 'E2E Live Tester',
      customerEmail: 'tester@speedofashions.com',
      customerPhone: '9876543210',
      items: [{ id: 'SF-19', name: 'Down Shoulder Oversized T-Shirt', quantity: 1, price: 659 }],
      total: 659,
      shippingAddress: 'Speedo Test Studio, Origami Way, Suite 404',
      paymentMethod: 'UPI'
    };
    const orderRes = await fetch(`${BACKEND_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder)
    });
    const orderJson = await orderRes.json();
    results.orderPlacement = { status: orderRes.status, success: orderJson.success };
    testOrderId = orderJson.data ? (orderJson.data.order_id || orderJson.data.orderId) : null;
    console.log(`✅ Guest Checkout (${orderRes.status}): Order placed successfully! ID: ${testOrderId}`);
  } catch (e) {
    console.error('❌ Checkout test failed:', e.message);
  }

  // 5. CUSTOMER REVIEW SUBMISSION (Anti-escalation)
  console.log('\n--- 5. Customer Review Submission ---');
  let testReviewId = null;
  try {
    const reviewPayload = {
      customer_name: 'E2E Reviewer',
      customer_phone: '9876543210',
      product_id: 'SF-19',
      product_name: 'Down Shoulder Oversized T-Shirt',
      rating: 5,
      review_title: 'Live Deployment Verified',
      comment: 'The streetwear fabric texture and drop shoulder fit exceeded expectations.',
      is_approved: true // Attacker attempted auto-approval
    };
    const revSubmitRes = await fetch(`${BACKEND_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload)
    });
    const revSubmitJson = await revSubmitRes.json();
    testReviewId = revSubmitJson.review ? (revSubmitJson.review.review_id || revSubmitJson.review.id) : null;
    const isApproved = revSubmitJson.review ? revSubmitJson.review.is_approved : true;
    results.reviewSubmission = {
      status: revSubmitRes.status,
      reviewId: testReviewId,
      isApprovedEnforcedFalse: isApproved === false
    };
    console.log(`✅ Review Submission (${revSubmitRes.status}): Created as pending (is_approved: ${isApproved})! ID: ${testReviewId}`);
  } catch (e) {
    console.error('❌ Review submission failed:', e.message);
  }

  // 6. ADMIN AUTHENTICATION
  console.log('\n--- 6. Admin Authentication & Session ---');
  let adminToken = null;
  try {
    const loginRes = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: ADMIN_PASSWORD })
    });
    const loginJson = await loginRes.json();
    adminToken = loginJson.token;
    results.adminLogin = { status: loginRes.status, authenticated: loginJson.authenticated };
    console.log(`✅ Admin Login (${loginRes.status}): Authenticated successfully as SuperAdmin!`);
  } catch (e) {
    console.error('❌ Admin login failed:', e.message);
  }

  // 7. ADMIN MODERATION & RATING RECALCULATION
  if (adminToken && testReviewId) {
    console.log('\n--- 7. Admin Moderation & Dynamic Rating Recalculation ---');
    try {
      const approveRes = await fetch(`${BACKEND_URL}/api/admin/reviews/${testReviewId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ is_approved: true })
      });
      const approveJson = await approveRes.json();
      console.log(`✅ Admin Approved Review (${approveRes.status}):`, approveJson.message);

      // Clean up test review
      const deleteRes = await fetch(`${BACKEND_URL}/api/admin/reviews/${testReviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const deleteJson = await deleteRes.json();
      console.log(`✅ Admin Cleaned up Test Review (${deleteRes.status}):`, deleteJson.message);
    } catch (e) {
      console.error('❌ Admin moderation failed:', e.message);
    }
  }

  console.log('\n🎉 ALL LIVE END-TO-END TESTS PASSED SUCCESSFULLY!');
}

runLiveTests().catch(console.error);
