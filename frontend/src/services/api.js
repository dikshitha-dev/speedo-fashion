import { getClient, isSupabaseConfigured } from './supabaseClient';

// Determine backend URL: use VITE_API_URL if configured, otherwise determine based on host
const getBackendUrl = () => {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // When running in production / deployed browser, default to the live Render backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://speedo-fashion.onrender.com';
  }
  return 'http://localhost:5000';
};

const BACKEND_URL = getBackendUrl();
const API_BASE = `${BACKEND_URL}/api`;

// Fallback initial products in INR
const FALLBACK_PRODUCTS = [
  {
    id: "SF-01",
    name: "Origami Polyhedron Parka",
    category: "Outerwear",
    price: 2499,
    originalPrice: 3299,
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    badge: "Bestseller",
    tag: "Tessellated Gore-Tex",
    rating: 4.9,
    reviewsCount: 128,
    sizes: ["S", "M", "L", "XL"],
    stock: 14,
    desc: "Engineered with laser-cut geometric baffles that expand and contract like Japanese Miura-ori folds for thermal control and ergonomic mobility."
  },
  {
    id: "SF-02",
    name: "Faceted Crease Bomber Jacket",
    category: "Outerwear",
    price: 1899,
    originalPrice: 2499,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    badge: "New Fold",
    tag: "Angular Stitching",
    rating: 4.8,
    reviewsCount: 94,
    sizes: ["M", "L", "XL"],
    stock: 8,
    desc: "Features dynamic diagonal fold seams reminiscent of classic paper planes, crafted from water-repellent crisp paper-touch matte nylon."
  },
  {
    id: "SF-03",
    name: "Geometric Pleated Kimono Coat",
    category: "Couture",
    price: 2999,
    originalPrice: 3799,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    badge: "Limited Run",
    tag: "Architectural Silk",
    rating: 5.0,
    reviewsCount: 67,
    sizes: ["XS", "S", "M", "L"],
    stock: 5,
    desc: "Inspired by traditional ceremonial paper folds, this coat highlights sculptural lapels and sharp angular hem geometries."
  },
  {
    id: "SF-04",
    name: "Asymmetric Origami Crisp Shirt",
    category: "Tops",
    price: 1199,
    originalPrice: 1599,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    badge: "Staff Pick",
    tag: "100% Washi Cotton",
    rating: 4.7,
    reviewsCount: 112,
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: 22,
    desc: "Structured with diagonal origami placket and faceted collar points. Retains sharp creases wash after wash without ironing."
  },
  {
    id: "SF-05",
    name: "Tessellated Cargo Pant 05",
    category: "Bottoms",
    price: 1599,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80",
    badge: "Trending",
    tag: "Dual-Facet Pockets",
    rating: 4.9,
    reviewsCount: 88,
    sizes: ["30", "32", "34", "36"],
    stock: 18,
    desc: "Modular 3D accordion origami cargo pockets engineered with high-density ripstop and magnetic geometric flap closures."
  },
  {
    id: "SF-06",
    name: "Low-Poly Sculptural Hoodie",
    category: "Tops",
    price: 1349,
    originalPrice: 1799,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    badge: "Essential",
    tag: "Faceted Double Weave",
    rating: 4.8,
    reviewsCount: 145,
    sizes: ["S", "M", "L", "XL"],
    stock: 19,
    desc: "Over-engineered hood with origami diamond crown construction that stands structurally elevated with paper-crease seams."
  }
];

export const api = {
  // Fetch Products (Supabase -> Node API -> LocalStorage)
  getProducts: async () => {
    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const { data, error } = await sb
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Normalize column names
          const mapped = data.map(p => {
            const imagesList = Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : (p.image ? [p.image] : []);
            return {
              id: p.id,
              name: p.name,
              category: p.category,
              price: Number(p.price),
              originalPrice: p.original_price ? Number(p.original_price) : null,
              images: imagesList,
              image: p.image || imagesList[0] || '',
              badge: p.badge,
              tag: p.tag,
              sizes: Array.isArray(p.sizes) ? p.sizes : ['S', 'M', 'L'],
              stock: Number(p.stock),
              desc: p.desc,
              rating: p.rating || 4.9,
              reviewsCount: p.reviews_count || 32
            };
          });
          localStorage.setItem('speedo_cache_products', JSON.stringify(mapped));
          return mapped;
        }
      } catch (sbErr) {
        console.warn('Supabase products fetch failed, falling back to REST API:', sbErr);
      }
    }

    // 2. Try Node Backend
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('Network error');
      const json = await res.json();
      const products = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      localStorage.setItem('speedo_cache_products', JSON.stringify(products));
      return products;
    } catch (err) {
      const cached = localStorage.getItem('speedo_cache_products');
      if (cached) return JSON.parse(cached);
      return [];
    }
  },

  // Add Product (Supabase -> Node API -> LocalStorage)
  addProduct: async (productData) => {
    const newId = 'SF-' + Math.floor(10 + Math.random() * 89);
    const resolvedPrice = parseFloat(productData.price || productData.originalPrice || 0);
    const resolvedOriginalPrice = productData.originalPrice ? parseFloat(productData.originalPrice) : resolvedPrice;
    const imagesList = Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images.slice(0, 5)
      : (productData.image ? [productData.image] : []);
    const primaryImage = productData.image || imagesList[0] || '';
    const formatted = {
      id: newId,
      name: productData.name,
      category: productData.category || 'Outerwear',
      price: resolvedPrice,
      original_price: resolvedOriginalPrice,
      image: primaryImage,
      images: imagesList,
      badge: productData.badge || 'New Arrival',
      tag: productData.tag || 'Premium Fabric',
      sizes: productData.sizes || ['S', 'M', 'L', 'XL'],
      stock: parseInt(productData.stock, 10) || 15,
      desc: productData.desc || '',
      rating: 5.0,
      reviews_count: 1
    };

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        let { data, error } = await sb
          .from('products')
          .insert([formatted])
          .select();

        // Handle PGRST204: images column missing in Supabase products table
        if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('images')))) {
          console.warn('Supabase products table missing images column, falling back to image column only');
          const fallbackFormatted = { ...formatted };
          delete fallbackFormatted.images;
          const retry = await sb
            .from('products')
            .insert([fallbackFormatted])
            .select();
          data = retry.data;
          error = retry.error;
        }

        if (!error && data && data[0]) {
          const item = {
            ...data[0],
            originalPrice: data[0].original_price,
            desc: data[0].desc,
            images: Array.isArray(data[0].images) && data[0].images.length > 0 ? data[0].images : (data[0].image ? [data[0].image] : imagesList),
            image: data[0].image || primaryImage
          };
          // Also sync locally
          const cached = JSON.parse(localStorage.getItem('speedo_cache_products') || '[]');
          cached.unshift(item);
          localStorage.setItem('speedo_cache_products', JSON.stringify(cached));
          return item;
        } else if (error) {
          console.warn('Supabase product insert error:', error.message);
        }
      } catch (sbErr) {
        console.warn('Supabase product insert failed, trying Node API:', sbErr);
      }
    }

    // 2. Try Node Backend
    try {
      const token = sessionStorage.getItem('speedo_admin_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(productData)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to create product (${res.status})`);
      }
      const json = await res.json();
      const createdItem = json.data || {
        id: newId,
        ...productData,
        price: resolvedPrice,
        originalPrice: resolvedOriginalPrice,
        image: primaryImage,
        images: imagesList
      };
      const cached = JSON.parse(localStorage.getItem('speedo_cache_products') || '[]');
      cached.unshift(createdItem);
      localStorage.setItem('speedo_cache_products', JSON.stringify(cached));
      return createdItem;
    } catch (err) {
      console.error('Failed to create product via Node API:', err);
      throw err;
    }
  },

  // Update Product (Supabase -> Node API -> LocalStorage)
  updateProduct: async (id, productData) => {
    const updatePayload = {
      name: productData.name,
      category: productData.category,
      price: parseFloat(productData.price),
      original_price: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
      image: productData.image || (Array.isArray(productData.images) && productData.images[0]) || '',
      images: Array.isArray(productData.images) ? productData.images.slice(0, 5) : (productData.image ? [productData.image] : []),
      badge: productData.badge,
      tag: productData.tag,
      stock: parseInt(productData.stock, 10),
      desc: productData.desc
    };

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        let { data, error } = await sb
          .from('products')
          .update(updatePayload)
          .eq('id', id)
          .select();

        // Handle PGRST204: images column missing in Supabase products table
        if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('images')))) {
          console.warn('Supabase products table missing images column on update, retrying without images');
          const fallbackPayload = { ...updatePayload };
          delete fallbackPayload.images;
          const retry = await sb
            .from('products')
            .update(fallbackPayload)
            .eq('id', id)
            .select();
          data = retry.data;
          error = retry.error;
        }

        if (!error && data && data[0]) {
          const updated = {
            ...data[0],
            id,
            price: parseFloat(data[0].price),
            originalPrice: data[0].original_price,
            images: Array.isArray(data[0].images) && data[0].images.length > 0 ? data[0].images : (data[0].image ? [data[0].image] : updatePayload.images),
            image: data[0].image || updatePayload.image
          };
          const cached = JSON.parse(localStorage.getItem('speedo_cache_products') || '[]');
          const idx = cached.findIndex(p => p.id === id);
          if (idx !== -1) cached[idx] = updated;
          localStorage.setItem('speedo_cache_products', JSON.stringify(cached));
          return updated;
        } else if (error) {
          console.warn('Supabase product update error:', error.message);
        }
      } catch (sbErr) {
        console.warn('Supabase product update failed:', sbErr);
      }
    }

    // 2. Try Node API
    try {
      const token = sessionStorage.getItem('speedo_admin_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(productData)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to update product (${res.status})`);
      }
      const json = await res.json();
      const updated = json.data || { ...productData, id };
      const cached = JSON.parse(localStorage.getItem('speedo_cache_products') || '[]');
      const index = cached.findIndex(p => p.id === id);
      if (index !== -1) {
        cached[index] = { ...cached[index], ...updated };
        localStorage.setItem('speedo_cache_products', JSON.stringify(cached));
      }
      return updated;
    } catch (err) {
      console.error('Failed to update product via Node API:', err);
      throw err;
    }
  },

  // Delete Product
  deleteProduct: async (id) => {
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        await sb.from('products').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('Supabase delete error:', sbErr);
      }
    }

    try {
      const token = sessionStorage.getItem('speedo_admin_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to delete product (${res.status})`);
      }
      const json = await res.json();
      const cached = JSON.parse(localStorage.getItem('speedo_cache_products') || '[]');
      const filtered = cached.filter(p => p.id !== id);
      localStorage.setItem('speedo_cache_products', JSON.stringify(filtered));
      return json.data || filtered;
    } catch (err) {
      console.warn('Backend product delete error:', err);
      const cached = JSON.parse(localStorage.getItem('speedo_cache_products') || '[]');
      const filtered = cached.filter(p => p.id !== id);
      localStorage.setItem('speedo_cache_products', JSON.stringify(filtered));
      return filtered;
    }
  },

  // Fetch Orders (Strictly via Authenticated Backend to Protect Customer Data)
  getOrders: async () => {
    try {
      const token = sessionStorage.getItem('speedo_admin_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/orders`, {
        headers,
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        const orders = Array.isArray(json.data) ? json.data : (Array.isArray(json.orders) ? json.orders : (Array.isArray(json) ? json : []));
        const mapped = orders.map(o => ({
          orderId: o.orderId || o.order_id,
          customerName: o.customerName || o.customer_name,
          customerEmail: o.customerEmail || o.customer_email,
          customerPhone: o.customerPhone || o.customer_phone,
          date: o.date || (o.created_at ? new Date(o.created_at).toISOString().replace('T', ' ').substring(0, 16) : ''),
          items: o.items || [],
          total: Number(o.total),
          status: o.status,
          shippingAddress: o.shippingAddress || o.shipping_address,
          paymentMethod: o.paymentMethod || o.payment_method,
          notes: o.notes
        }));
        localStorage.setItem('speedo_cache_orders', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Backend orders fetch failed, reading cache:', err);
    }

    const cached = JSON.parse(localStorage.getItem('speedo_cache_orders') || '[]');
    return cached;
  },

  // Place Order
  createOrder: async (orderData) => {
    const orderId = 'SF-ORD-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      order_id: orderId,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      items: orderData.items,
      total: parseFloat(orderData.total),
      status: 'Pending',
      shipping_address: orderData.shippingAddress,
      payment_method: orderData.paymentMethod,
      notes: orderData.notes
    };

    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const { data, error } = await sb
          .from('orders')
          .insert([newOrder])
          .select();

        if (!error && data && data[0]) {
          const ord = {
            orderId: data[0].order_id,
            customerName: data[0].customer_name,
            customerEmail: data[0].customer_email,
            customerPhone: data[0].customer_phone,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            items: data[0].items,
            total: data[0].total,
            status: data[0].status,
            shippingAddress: data[0].shipping_address,
            paymentMethod: data[0].payment_method,
            notes: data[0].notes
          };
          const cached = JSON.parse(localStorage.getItem('speedo_cache_orders') || '[]');
          cached.unshift(ord);
          localStorage.setItem('speedo_cache_orders', JSON.stringify(cached));
          return ord;
        }
      } catch (sbErr) {
        console.warn('Supabase createOrder failed:', sbErr);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) throw new Error('Order creation failed');
      const json = await res.json();
      return json.data;
    } catch (err) {
      const cached = JSON.parse(localStorage.getItem('speedo_cache_orders') || '[]');
      const fallbackOrder = {
        orderId,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Pending',
        ...orderData
      };
      cached.unshift(fallbackOrder);
      localStorage.setItem('speedo_cache_orders', JSON.stringify(cached));
      return fallbackOrder;
    }
  },

  // Update Order Status
  updateOrderStatus: async (orderId, status) => {
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        await sb.from('orders').update({ status }).eq('order_id', orderId);
      } catch (sbErr) {
        console.warn('Supabase order status error:', sbErr);
      }
    }

    try {
      const token = sessionStorage.getItem('speedo_admin_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Status update failed');
      const json = await res.json();
      return json.data;
    } catch (err) {
      const cached = JSON.parse(localStorage.getItem('speedo_cache_orders') || '[]');
      const order = cached.find(o => o.orderId === orderId);
      if (order) order.status = status;
      localStorage.setItem('speedo_cache_orders', JSON.stringify(cached));
      return order;
    }
  },

  // Admin Stats — strictly dynamic from Supabase / Orders
  getAdminStats: async () => {
    try {
      const orders = await api.getOrders();
      const products = await api.getProducts();

      // REVENUE: Calculate strictly from successfully delivered orders. Exclude cancelled orders.
      const deliveredOrdersList = orders.filter(
        o => (o.status || '').trim().toLowerCase() === 'delivered'
      );
      const totalRevenue = deliveredOrdersList.reduce(
        (sum, o) => sum + (parseFloat(o.total) || 0),
        0
      );

      // TOTAL ORDERS: All orders placed by customers
      const totalOrders = orders.length;

      // DELIVERED ORDERS: Total with status 'delivered'
      const deliveredOrders = deliveredOrdersList.length;

      // PENDING ORDERS: Number of orders awaiting fulfillment (exclude Delivered and Cancelled)
      const pendingOrdersList = orders.filter(o => {
        const s = (o.status || '').trim().toLowerCase();
        return s !== 'delivered' && s !== 'cancelled';
      });
      const pendingOrders = pendingOrdersList.length;
      const cancelledOrders = orders.filter(
        o => (o.status || '').trim().toLowerCase() === 'cancelled'
      ).length;

      const totalStock = products.reduce((sum, p) => sum + (parseInt(p.stock, 10) || 0), 0);
      const avgOrderValue = deliveredOrders > 0 ? (totalRevenue / deliveredOrders).toFixed(2) : '0';

      return {
        totalRevenue: totalRevenue.toFixed(2),
        totalRevenueNumeric: totalRevenue,
        totalOrders,
        deliveredOrders,
        pendingOrders,
        cancelledOrders,
        productsCount: products.length,
        totalStock,
        avgOrderValue
      };
    } catch (err) {
      console.warn('Failed to calculate admin stats dynamically:', err);
      return {
        totalRevenue: '0.00',
        totalRevenueNumeric: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        productsCount: 0,
        totalStock: 0,
        avgOrderValue: '0'
      };
    }
  },

  // Admin Login (Server-side validation + HTTP-Only Session Cookie)
  adminLogin: async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('speedo_admin_token', data.token);
        return data;
      }
      return { success: false, message: data.message || 'Invalid username or password.' };
    } catch (err) {
      console.error('Backend login request error:', err);
      return { success: false, message: 'Unable to connect to authentication server. Please check backend connection.' };
    }
  },

  // Check Admin Server Session
  checkAdminAuth: async () => {
    const token = sessionStorage.getItem('speedo_admin_token');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/admin/me`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          return data.user || { username: 'admin', role: 'SuperAdmin' };
        }
      }
    } catch (err) {
      // In offline/standalone demo mode: verify if valid session token was saved during session
      if (token && token.startsWith('speedo-admin-')) {
        return { username: 'admin', role: 'SuperAdmin' };
      }
    }
    return null;
  },

  // Admin Logout
  adminLogout: async () => {
    const token = sessionStorage.getItem('speedo_admin_token');
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${API_BASE}/admin/logout`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });
    } catch (e) {
      // ignore
    }
    sessionStorage.removeItem('speedo_admin_token');
    return true;
  },

  // --- CUSTOMER FEEDBACK & REVIEWS SYSTEM (SUPABASE + API) ---
  
  // 1. Get Published Feedback (Customer Storefront)
  getFeedback: async () => {
    // 1. Try Supabase directly
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const { data, error } = await sb
          .from('feedback')
          .select('*')
          .or('is_published.eq.true,status.eq.approved')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(f => ({
            id: f.id,
            customerId: f.customer_id,
            customerName: f.customer_name,
            rating: Number(f.rating) || 5,
            comment: f.comment,
            status: f.status || 'approved',
            isPublished: f.is_published ?? true,
            verified: f.verified ?? true,
            createdAt: f.created_at,
            date: f.created_at ? new Date(f.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recent'
          }));
          localStorage.setItem('speedo_cache_feedback', JSON.stringify(mapped));
          return mapped;
        }
      } catch (sbErr) {
        console.warn('Supabase feedback fetch error, trying backend API:', sbErr);
      }
    }

    // 2. Try Node Backend
    try {
      const res = await fetch(`${API_BASE}/feedback`);
      if (res.ok) {
        const data = await res.json();
        if (data.feedback && data.feedback.length > 0) {
          const mapped = data.feedback.map(f => ({
            id: f.id,
            customerId: f.customer_id || f.customerId,
            customerName: f.customer_name || f.name,
            rating: Number(f.rating) || 5,
            comment: f.comment || f.quote,
            status: f.status || 'approved',
            isPublished: f.is_published ?? true,
            verified: f.verified ?? true,
            createdAt: f.created_at || f.date,
            date: f.created_at ? new Date(f.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : (f.date || 'Recent')
          }));
          localStorage.setItem('speedo_cache_feedback', JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Backend feedback fetch warning:', e);
    }

    // 3. Fallback cache or default verified testimonials
    const cached = localStorage.getItem('speedo_cache_feedback');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {}
    }

    return [
      {
        id: 1,
        customerId: '9845112099',
        customerName: "Sophia Lindqvist",
        rating: 5,
        comment: "The Polyhedron Parka is the most striking silhouette I have ever worn. The origami crease holds its sharp 3D facets even in heavy downpours.",
        status: 'approved',
        isPublished: true,
        verified: true,
        createdAt: new Date('2026-10-15').toISOString(),
        date: "October 2026"
      },
      {
        id: 2,
        customerId: '9930288410',
        customerName: "Daisuke Mori",
        rating: 5,
        comment: "Speedo Fashions has redefined technical streetwear. Folding it flat into my luggage without a single unwanted wrinkle is pure mathematical genius.",
        status: 'approved',
        isPublished: true,
        verified: true,
        createdAt: new Date('2026-09-28').toISOString(),
        date: "September 2026"
      },
      {
        id: 3,
        customerId: '9876543210',
        customerName: "Amara O'Connor",
        rating: 5,
        comment: "The Kimono Coat lapels look like museum-grade contemporary paper art. You can feel the tactile density of the washi silk blend immediately.",
        status: 'approved',
        isPublished: true,
        verified: true,
        createdAt: new Date('2026-10-22').toISOString(),
        date: "October 2026"
      },
      {
        id: 4,
        customerId: '6303202964',
        customerName: "Vikram Malhotra",
        rating: 5,
        comment: "Exceptional fabric engineering. The comfort stretch and geometric cuts elevate everyday streetwear to runway couture level.",
        status: 'approved',
        isPublished: true,
        verified: true,
        createdAt: new Date('2026-11-01').toISOString(),
        date: "November 2026"
      }
    ];
  },

  // 2. Submit Feedback (Customer)
  submitFeedback: async ({ customerId, customerName, customerPhone, rating, comment }) => {
    if (!comment || !comment.trim()) {
      throw new Error('Please enter your feedback comments before submitting.');
    }
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      throw new Error('Please select a rating between 1 and 5 stars.');
    }
    if (!customerName || !customerName.trim()) {
      throw new Error('Customer name is required.');
    }
    const verifiedRef = (customerPhone || customerId || '').trim();
    if (!verifiedRef) {
      throw new Error('You must be signed in as a verified customer to submit feedback.');
    }

    const payload = {
      customer_id: verifiedRef,
      customer_name: customerName.trim(),
      rating: numRating,
      comment: comment.trim(),
      status: 'pending',
      is_published: false,
      verified: true
    };

    // 1. Try Supabase insert
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const { data, error } = await sb
          .from('feedback')
          .insert([payload])
          .select();

        if (!error && data && data[0]) {
          return {
            success: true,
            message: 'Thank you! Your feedback has been submitted successfully for atelier verification.',
            feedback: data[0]
          };
        }
      } catch (sbErr) {
        console.warn('Supabase feedback insert error, falling back to REST API:', sbErr);
      }
    }

    // 2. Try Node REST Backend
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: verifiedRef,
          customerName: customerName.trim(),
          customerPhone: verifiedRef,
          rating: numRating,
          comment: comment.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      return data;
    } catch (apiErr) {
      // In offline / preview mode fallback:
      const fallbackItem = {
        id: Date.now(),
        customerId: verifiedRef,
        customerName: customerName.trim(),
        rating: numRating,
        comment: comment.trim(),
        status: 'pending',
        isPublished: false,
        verified: true,
        createdAt: new Date().toISOString()
      };
      return {
        success: true,
        message: 'Thank you! Your feedback has been submitted successfully for atelier verification.',
        feedback: fallbackItem
      };
    }
  },

  // 3. Admin: Get ALL Feedback (Pending + Published)
  getAdminFeedback: async () => {
    // 1. Try Supabase directly
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const { data, error } = await sb
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(f => ({
            id: f.id,
            customerId: f.customer_id,
            customerName: f.customer_name,
            rating: Number(f.rating) || 5,
            comment: f.comment,
            status: f.status || (f.is_published ? 'approved' : 'pending'),
            isPublished: !!f.is_published,
            verified: f.verified ?? true,
            createdAt: f.created_at,
            date: f.created_at ? new Date(f.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recent'
          }));
        }
      } catch (sbErr) {
        console.warn('Supabase admin feedback fetch error:', sbErr);
      }
    }

    // 2. Try Node Backend
    const token = sessionStorage.getItem('speedo_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/admin/feedback`, { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.feedback) {
          return data.feedback.map(f => ({
            id: f.id,
            customerId: f.customer_id || f.customerId,
            customerName: f.customer_name || f.name,
            rating: Number(f.rating) || 5,
            comment: f.comment || f.quote,
            status: f.status || (f.is_published ? 'approved' : 'pending'),
            isPublished: !!(f.is_published || f.featured),
            verified: f.verified ?? true,
            createdAt: f.created_at || f.date,
            date: f.created_at ? new Date(f.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : (f.date || 'Recent')
          }));
        }
      }
    } catch (e) {}

    // Fallback default feedback list
    return await api.getFeedback();
  },

  // 4. Admin: Approve / Publish or Hide Feedback
  updateFeedbackStatus: async (id, { is_published, status }) => {
    const targetPublished = is_published !== undefined ? !!is_published : true;
    const targetStatus = status || (targetPublished ? 'approved' : 'pending');

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        await sb
          .from('feedback')
          .update({ is_published: targetPublished, status: targetStatus })
          .eq('id', id);
      } catch (sbErr) {
        console.warn('Supabase feedback update error:', sbErr);
      }
    }

    // 2. Try Node Backend
    const token = sessionStorage.getItem('speedo_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/admin/feedback/${id}/publish`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ is_published: targetPublished, status: targetStatus })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return { success: true, message: 'Status updated' };
  },

  // 5. Admin: Delete Feedback
  deleteFeedback: async (id) => {
    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        await sb.from('feedback').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('Supabase feedback delete error:', sbErr);
      }
    }

    // 2. Try Node Backend
    const token = sessionStorage.getItem('speedo_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/admin/feedback/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return { success: true, message: 'Feedback deleted' };
  },

  // // --- CUSTOMER REVIEWS & MODERATION SYSTEM ---
  // 1. Get Approved Reviews for Storefront (Optionally filtered by productId)
  getReviews: async (productId = null) => {
    // Try Supabase directly
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        let query = sb
          .from('reviews')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (productId) {
          query = query.eq('product_id', productId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped = data.map(r => ({
            id: r.id || r.review_id,
            reviewId: r.review_id || String(r.id),
            customerId: r.customer_id,
            customerName: r.customer_name,
            name: r.customer_name,
            productId: r.product_id,
            productName: r.product_name,
            item: r.product_name,
            rating: Number(r.rating) || 5,
            reviewTitle: r.review_title || 'Verified Review',
            title: r.review_title || 'Verified Review',
            comment: r.comment,
            quote: r.comment,
            isApproved: true,
            isFeatured: !!r.is_featured,
            featured: !!r.is_featured,
            verifiedPurchase: !!r.verified_purchase,
            verified: !!r.verified_purchase,
            createdAt: r.created_at,
            date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recent'
          }));
          return mapped;
        }
      } catch (sbErr) {
        console.warn('Supabase get reviews error, trying backend API:', sbErr);
      }
    }

    // Try Node Backend
    try {
      const url = productId ? `${API_BASE}/reviews?productId=${encodeURIComponent(productId)}` : `${API_BASE}/reviews`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.reviews && Array.isArray(json.reviews)) {
          return json.reviews.map(r => ({
            id: r.id || r.review_id,
            reviewId: r.review_id || String(r.id),
            customerId: r.customer_id,
            customerName: r.customer_name || r.name,
            name: r.customer_name || r.name,
            productId: r.product_id,
            productName: r.product_name || r.item,
            item: r.product_name || r.item,
            rating: Number(r.rating) || 5,
            reviewTitle: r.review_title || r.title || 'Verified Review',
            title: r.review_title || r.title || 'Verified Review',
            comment: r.comment || r.quote,
            quote: r.comment || r.quote,
            isApproved: r.is_approved ?? (r.status === 'approved'),
            isFeatured: !!(r.is_featured ?? r.featured),
            featured: !!(r.is_featured ?? r.featured),
            verifiedPurchase: !!(r.verified_purchase ?? r.verified),
            verified: !!(r.verified_purchase ?? r.verified),
            createdAt: r.created_at,
            date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : (r.date || 'Recent')
          }));
        }
      }
    } catch (e) {
      console.warn('Backend get reviews warning:', e);
    }

    // Fallback default approved reviews
    return [
      {
        id: 1,
        reviewId: 'REV-101',
        customerId: '9845112099',
        customerName: 'Sophia Lindqvist',
        name: 'Sophia Lindqvist',
        productId: 'SF-01',
        productName: 'Origami Polyhedron Parka',
        item: 'Origami Polyhedron Parka',
        rating: 5,
        reviewTitle: 'Museum-grade Streetwear',
        title: 'Museum-grade Streetwear',
        comment: 'The Polyhedron Parka is the most striking silhouette I have ever worn. The origami crease holds its sharp 3D facets even in heavy downpours.',
        quote: 'The Polyhedron Parka is the most striking silhouette I have ever worn. The origami crease holds its sharp 3D facets even in heavy downpours.',
        isApproved: true,
        isFeatured: true,
        featured: true,
        verifiedPurchase: true,
        verified: true,
        date: 'October 2026'
      },
      {
        id: 2,
        reviewId: 'REV-102',
        customerId: '9930288410',
        customerName: 'Daisuke Mori',
        name: 'Daisuke Mori',
        productId: 'SF-02',
        productName: 'Faceted Crease Bomber Jacket',
        item: 'Faceted Crease Bomber Jacket',
        rating: 5,
        reviewTitle: 'Mathematical Genius',
        title: 'Mathematical Genius',
        comment: 'Speedo Fashions has redefined technical streetwear. Folding it flat into my luggage without a single unwanted wrinkle is pure mathematical genius.',
        quote: 'Speedo Fashions has redefined technical streetwear. Folding it flat into my luggage without a single unwanted wrinkle is pure mathematical genius.',
        isApproved: true,
        isFeatured: true,
        featured: true,
        verifiedPurchase: true,
        verified: true,
        date: 'September 2026'
      },
      {
        id: 3,
        reviewId: 'REV-103',
        customerId: '9876543210',
        customerName: "Amara O'Connor",
        name: "Amara O'Connor",
        productId: 'SF-03',
        productName: 'Geometric Pleated Kimono Coat',
        item: 'Geometric Pleated Kimono Coat',
        rating: 5,
        reviewTitle: 'Architectural Silk Density',
        title: 'Architectural Silk Density',
        comment: 'The Kimono Coat lapels look like museum-grade contemporary paper art. You can feel the tactile density of the washi silk blend immediately.',
        quote: 'The Kimono Coat lapels look like museum-grade contemporary paper art. You can feel the tactile density of the washi silk blend immediately.',
        isApproved: true,
        isFeatured: true,
        featured: true,
        verifiedPurchase: true,
        verified: true,
        date: 'October 2026'
      },
      {
        id: 4,
        reviewId: 'REV-104',
        customerId: '6303202964',
        customerName: 'Vikram Malhotra',
        name: 'Vikram Malhotra',
        productId: 'SF-05',
        productName: 'Tessellated Cargo Pant 05',
        item: 'Tessellated Cargo Pant 05',
        rating: 5,
        reviewTitle: 'Superb Everyday Comfort',
        title: 'Superb Everyday Comfort',
        comment: 'Exceptional fabric engineering. The comfort stretch and geometric cuts elevate everyday streetwear to runway couture level.',
        quote: 'Exceptional fabric engineering. The comfort stretch and geometric cuts elevate everyday streetwear to runway couture level.',
        isApproved: true,
        isFeatured: true,
        featured: true,
        verifiedPurchase: true,
        verified: true,
        date: 'November 2026'
      }
    ];
  },

  // 2. Customer: Submit Review (Default isApproved = false)
  submitReview: async (reviewData) => {
    // 1. Try Backend API
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      console.warn('Backend submit review failed, trying Supabase direct:', e);
    }

    // 2. Direct Supabase
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const revId = 'REV-' + Math.floor(100000 + Math.random() * 900000);
        const { data, error } = await sb
          .from('reviews')
          .insert([{
            review_id: revId,
            customer_id: reviewData.customerId || reviewData.customer_id || 'guest',
            customer_name: reviewData.customerName || reviewData.customer_name,
            product_id: reviewData.productId || reviewData.product_id || null,
            product_name: reviewData.productName || reviewData.product_name || 'Speedo Product',
            rating: Number(reviewData.rating) || 5,
            review_title: reviewData.reviewTitle || reviewData.review_title || 'Customer Review',
            comment: reviewData.comment || reviewData.quote,
            is_approved: false, // Default is false!
            is_featured: false,
            verified_purchase: false
          }])
          .select();

        if (!error && data) {
          return {
            success: true,
            message: 'Thank you! Your review has been submitted and will appear on the storefront once approved by our moderation team.',
            review: data[0]
          };
        }
      } catch (sbErr) {
        console.warn('Supabase direct review insert error:', sbErr);
      }
    }

    return {
      success: true,
      message: 'Thank you! Your review has been submitted and will appear on the storefront once approved by our moderation team.'
    };
  },

  // 3. Admin: Get ALL Reviews (Approved + Pending)
  // Calls authenticated backend directly using admin session credentials
  getAdminReviews: async () => {
    try {
      const token = sessionStorage.getItem('speedo_admin_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/admin/reviews`, {
        headers,
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        const reviewList = json.reviews || json.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(reviewList)) {
          return reviewList.map(r => ({
            id: r.id || r.review_id,
            reviewId: r.review_id || String(r.id),
            customerId: r.customer_id,
            customerName: r.customer_name || r.name,
            name: r.customer_name || r.name,
            productId: r.product_id,
            productName: r.product_name || r.item,
            item: r.product_name || r.item,
            rating: Number(r.rating) || 5,
            reviewTitle: r.review_title || r.title || 'Review',
            title: r.review_title || r.title || 'Review',
            comment: r.comment || r.quote,
            quote: r.comment || r.quote,
            isApproved: !!(r.is_approved || r.isApproved || r.status === 'approved'),
            isFeatured: !!(r.is_featured || r.featured),
            featured: !!(r.is_featured || r.featured),
            verifiedPurchase: !!(r.verified_purchase || r.verified),
            verified: !!(r.verified_purchase || r.verified),
            status: (r.is_approved || r.status === 'approved') ? 'approved' : 'pending',
            createdAt: r.created_at,
            date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'
          }));
        }
      }
    } catch (e) {
      console.warn('Backend admin reviews warning:', e);
    }

    return await api.getReviews();
  },

  // 4. Admin: Approve or Reject Review (Exclusively via authenticated backend)
  approveReview: async (id, isApproved) => {
    const token = sessionStorage.getItem('speedo_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/admin/reviews/${id}/approve`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ is_approved: isApproved })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update review approval (${res.status})`);
    }
    return await res.json();
  },

  // 5. Admin: Feature or Unfeature Review (Exclusively via authenticated backend)
  featureReview: async (id, isFeatured) => {
    const token = sessionStorage.getItem('speedo_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/admin/reviews/${id}/feature`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ is_featured: isFeatured })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update review featured status (${res.status})`);
    }
    return await res.json();
  },

  // 6. Admin: Delete Review (Exclusively via authenticated backend)
  deleteReview: async (id) => {
    const token = sessionStorage.getItem('speedo_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/admin/reviews/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to delete review (${res.status})`);
    }
    return await res.json();
  },

    addReview: async (reviewData) => {
    return await api.submitReview(reviewData);
  },

  updateReview: async (id, reviewData) => {
    if (reviewData.is_approved !== undefined) {
      return await api.approveReview(id, reviewData.is_approved);
    }
    if (reviewData.featured !== undefined) {
      return await api.featureReview(id, reviewData.featured);
    }
    return { success: true };
  },
  
  // --- CATEGORIES MANAGEMENT (SUPABASE + API) ---
  getCategories: async () => {
    const defaultCats = [
      { id: 1, name: 'Outerwear', slug: 'outerwear', description: 'Architectural parkas, bombers & weatherproof origami cloaks', productCount: 2 },
      { id: 2, name: 'Couture', slug: 'couture', description: 'Limited-edition sculptural coats & runway showpieces', productCount: 1 },
      { id: 3, name: 'Tops', slug: 'tops', description: 'Precision-creased shirts, hoodies & angular blouses', productCount: 2 },
      { id: 4, name: 'Bottoms', slug: 'bottoms', description: 'Tessellated cargo pants & geometric pleated trousers', productCount: 1 }
    ];

    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const [catRes, prodRes] = await Promise.all([
          sb.from('categories').select('*').order('id', { ascending: true }),
          sb.from('products').select('category')
        ]);

        if (!catRes.error && catRes.data && catRes.data.length > 0) {
          const counts = {};
          if (prodRes.data) {
            prodRes.data.forEach(p => {
              if (p.category) {
                const k = p.category.trim().toLowerCase();
                counts[k] = (counts[k] || 0) + 1;
              }
            });
          }
          const mapped = catRes.data.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            productCount: counts[c.name.trim().toLowerCase()] || 0
          }));
          localStorage.setItem('speedo_cache_categories', JSON.stringify(mapped));
          return mapped;
        }
      } catch (sbErr) {
        console.warn('Supabase categories fetch error:', sbErr);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          localStorage.setItem('speedo_cache_categories', JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend categories fetch failed, using cache:', err.message);
    }

    const cached = localStorage.getItem('speedo_cache_categories');
    if (cached) return JSON.parse(cached);
    return defaultCats;
  },

  addCategory: async (categoryData) => {
    const trimmed = categoryData.name.trim();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        // Check duplicate
        const { data: existing } = await sb
          .from('categories')
          .select('id, name')
          .ilike('name', trimmed);

        if (existing && existing.length > 0) {
          throw new Error(`Category "${trimmed}" already exists.`);
        }

        const { data, error } = await sb
          .from('categories')
          .insert([{
            name: trimmed,
            slug: slug || 'cat-' + Date.now(),
            description: categoryData.description ? categoryData.description.trim() : ''
          }])
          .select();

        if (error) throw new Error(error.message);
        if (data && data[0]) {
          return {
            id: data[0].id,
            name: data[0].name,
            slug: data[0].slug,
            description: data[0].description,
            productCount: 0
          };
        }
      } catch (sbErr) {
        if (sbErr.message && (sbErr.message.includes('already exists') || sbErr.message.includes('unique'))) {
          throw new Error(`Category "${trimmed}" already exists.`);
        }
        console.warn('Supabase addCategory failed, trying backend API:', sbErr);
      }
    }

    const token = sessionStorage.getItem('speedo_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ name: trimmed, description: categoryData.description })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to add category');
    return json.data;
  },

  updateCategory: async (id, categoryData) => {
    const trimmed = categoryData.name.trim();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const { data: existing } = await sb
          .from('categories')
          .select('id, name')
          .ilike('name', trimmed)
          .neq('id', id);

        if (existing && existing.length > 0) {
          throw new Error(`Another category named "${trimmed}" already exists.`);
        }

        const { data: oldCat } = await sb.from('categories').select('name').eq('id', id).single();

        const { data, error } = await sb
          .from('categories')
          .update({
            name: trimmed,
            slug,
            description: categoryData.description ? categoryData.description.trim() : ''
          })
          .eq('id', id)
          .select();

        if (error) throw new Error(error.message);

        // Cascade rename to products
        if (oldCat && oldCat.name !== trimmed) {
          await sb.from('products').update({ category: trimmed }).eq('category', oldCat.name);
        }

        return data && data[0] ? data[0] : null;
      } catch (sbErr) {
        if (sbErr.message && (sbErr.message.includes('already exists') || sbErr.message.includes('unique'))) {
          throw sbErr;
        }
        console.warn('Supabase updateCategory error:', sbErr);
      }
    }

    const token = sessionStorage.getItem('speedo_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ name: trimmed, description: categoryData.description })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update category');
    return json.data;
  },

  deleteCategory: async (id, categoryName) => {
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        // Check if assigned to any products
        const { data: assigned } = await sb
          .from('products')
          .select('id, name')
          .ilike('category', categoryName);

        if (assigned && assigned.length > 0) {
          throw new Error(`Cannot delete category "${categoryName}". It has ${assigned.length} assigned product(s). Please reassign or delete them first.`);
        }

        const { error } = await sb.from('categories').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return true;
      } catch (sbErr) {
        if (sbErr.message && sbErr.message.includes('assigned product')) throw sbErr;
        console.warn('Supabase delete category error, falling back to backend:', sbErr.message);
      }
    }

    const token = sessionStorage.getItem('speedo_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete category');
    return true;
  },

  // --- CUSTOMER ACCOUNT & ADDRESS MANAGEMENT (SUPABASE + API) ---
  sendCustomerOtp: async (phone) => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    
    try {
      const res = await fetch(`${API_BASE}/customer/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend send-otp failed, falling back to local simulation:', e.message);
    }

    // Local simulation fallback
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    sessionStorage.setItem(`speedo_otp_${cleanPhone}`, otp);
    return {
      success: true,
      message: `OTP sent to ${cleanPhone}`,
      otp: otp
    };
  },

  verifyCustomerOtp: async (phone, otp, name) => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanOtp = String(otp).trim();

    // 1. Try Backend API
    try {
      const res = await fetch(`${API_BASE}/customer/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp, name })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.customer) {
          localStorage.setItem('speedo_customer', JSON.stringify(json.customer));
          return json.customer;
        }
      }
    } catch (err) {
      console.warn('Backend verify-otp error, using Supabase direct:', err.message);
    }

    // 2. Direct Supabase Fallback
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const { data: existing } = await sb
          .from('customers')
          .select('*')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existing) {
          if (name && name.trim()) {
            const { data: updated } = await sb
              .from('customers')
              .update({ name: name.trim(), updated_at: new Date().toISOString() })
              .eq('phone', cleanPhone)
              .select()
              .single();
            const result = updated || existing;
            localStorage.setItem('speedo_customer', JSON.stringify(result));
            return result;
          }
          localStorage.setItem('speedo_customer', JSON.stringify(existing));
          return existing;
        }

        // Create new in Supabase
        const { data: created, error } = await sb
          .from('customers')
          .insert([{
            phone: cleanPhone,
            name: name || 'Valued Customer',
            saved_address: '',
            city: '',
            state: '',
            pincode: ''
          }])
          .select()
          .single();

        if (!error && created) {
          localStorage.setItem('speedo_customer', JSON.stringify(created));
          return created;
        }
      } catch (sbErr) {
        console.warn('Supabase customer direct auth failed:', sbErr);
      }
    }

    // 3. LocalStorage fallback
    const localCustomer = {
      phone: cleanPhone,
      name: name || 'Valued Customer',
      saved_address: '',
      city: '',
      state: '',
      pincode: ''
    };
    localStorage.setItem('speedo_customer', JSON.stringify(localCustomer));
    return localCustomer;
  },

  updateCustomerProfile: async (phone, addressData) => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    // 1. Try Backend API
    try {
      const res = await fetch(`${API_BASE}/customer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, ...addressData })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.customer) {
          localStorage.setItem('speedo_customer', JSON.stringify(json.customer));
          return json.customer;
        }
      }
    } catch (e) {
      console.warn('Backend updateCustomerProfile failed, trying Supabase direct:', e.message);
    }

    // 2. Direct Supabase Fallback
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const { data, error } = await sb
          .from('customers')
          .update({
            ...addressData,
            updated_at: new Date().toISOString()
          })
          .eq('phone', cleanPhone)
          .select()
          .single();

        if (!error && data) {
          localStorage.setItem('speedo_customer', JSON.stringify(data));
          return data;
        }
      } catch (sbErr) {
        console.warn('Supabase updateCustomerProfile direct failed:', sbErr);
      }
    }

    // Local storage fallback
    const current = JSON.parse(localStorage.getItem('speedo_customer') || '{}');
    const updated = { ...current, ...addressData, phone: cleanPhone };
    localStorage.setItem('speedo_customer', JSON.stringify(updated));
    return updated;
  },

  getCustomerOrders: async (phone) => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const phoneSuffix = cleanPhone.slice(-10);

    // 1. Try Backend API
    try {
      const res = await fetch(`${API_BASE}/customer/orders/${cleanPhone}`);
      if (res.ok) {
        const json = await res.json();
        return json.orders || [];
      }
    } catch (e) {}

    // 2. Direct Supabase
    if (isSupabaseConfigured()) {
      try {
        const sb = getClient();
        const { data, error } = await sb
          .from('orders')
          .select('*')
          .ilike('customer_phone', `%${phoneSuffix}%`)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(o => ({
            orderId: o.order_id,
            customerName: o.customer_name,
            total: Number(o.total),
            status: o.status,
            date: o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '',
            items: o.items || [],
            shippingAddress: o.shipping_address,
            paymentMethod: o.payment_method
          }));
        }
      } catch (sbErr) {}
    }

    const allOrders = JSON.parse(localStorage.getItem('speedo_cache_orders') || '[]');
    return allOrders.filter(o => o.customerPhone && o.customerPhone.includes(phoneSuffix));
  }
};
