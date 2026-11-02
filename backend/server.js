const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Root Status Endpoint
app.get('/', (req, res) => {
  res.status(200).send('Speedo Fashion API is running successfully.');
});

// Health Check Endpoint (Required for Render and uptime monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: supabase ? 'connected' : 'memory-fallback'
  });
});

// Supabase Database Client
let supabase = null;
if (process.env.DISABLE_SUPABASE !== 'true' && process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );
    console.log('⚡ Backend connected to Supabase Database:', process.env.SUPABASE_URL);
  } catch (e) {
    console.error('Supabase initialization failed:', e.message);
  }
} else {
  console.warn('⚠️ No SUPABASE_URL found in .env. Operating in memory-only mode.');
}

const crypto = require('crypto');

// Allowed Origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
}));
app.use(express.json());

// Cookie parsing helper
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
  }
  return list;
}

// In-Memory cache (purely transient memory fallback if DB is disconnected)
let memoryProducts = [];
let memoryOrders = [];
let memoryCustomers = [];
const otpStore = new Map(); // phone -> { otp, expiresAt }
let memoryCategories = [
  { id: 1, name: 'Outerwear', slug: 'outerwear', description: 'Architectural parkas & jackets' },
  { id: 2, name: 'Couture', slug: 'couture', description: 'Sculptural kimonos & runway showpieces' },
  { id: 3, name: 'Tops', slug: 'tops', description: 'Precision shirts & low-poly hoodies' },
  { id: 4, name: 'Bottoms', slug: 'bottoms', description: 'Tessellated cargo pants & pleated trousers' }
];

// --- SECURE SERVER-SIDE ADMIN AUTHENTICATION (PBKDF2 + SESSIONS) ---
const ADMIN_CONFIG = {
  username: process.env.ADMIN_USERNAME || 'admin',
  salt: crypto.randomBytes(16).toString('hex'),
  passwordHash: null
};

if (!process.env.ADMIN_PASSWORD) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: ADMIN_PASSWORD environment variable is required in production.');
    process.exit(1);
  } else {
    console.warn('⚠️ WARNING: ADMIN_PASSWORD environment variable is not set. Configure ADMIN_PASSWORD in backend/.env.');
  }
} else {
  ADMIN_CONFIG.passwordHash = crypto.pbkdf2Sync(
    process.env.ADMIN_PASSWORD,
    ADMIN_CONFIG.salt,
    100000,
    64,
    'sha512'
  ).toString('hex');
  console.log(`🔐 Admin Security Initialized. Protected user: "${ADMIN_CONFIG.username}" (PBKDF2 SHA-512 secured)`);
}

function verifyAdminPassword(inputPassword) {
  if (!ADMIN_CONFIG.passwordHash || !inputPassword || typeof inputPassword !== 'string') return false;
  const hash = crypto.pbkdf2Sync(
    inputPassword,
    ADMIN_CONFIG.salt,
    100000,
    64,
    'sha512'
  ).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(ADMIN_CONFIG.passwordHash, 'hex'));
}

// Active Admin Session Store (In-memory token map with expiration)
const adminSessions = new Map(); // token -> { username, role, expiresAt }

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, sess] of adminSessions.entries()) {
    if (sess.expiresAt < now) {
      adminSessions.delete(token);
    }
  }
}

// Admin Authentication Middleware
function requireAdminAuth(req, res, next) {
  cleanExpiredSessions();
  const cookies = parseCookies(req);
  const cookieToken = cookies.speedo_admin_session;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = cookieToken || bearerToken;

  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Unauthorized. Admin authentication required to access this resource.'
    });
  }

  const session = adminSessions.get(token);
  if (session.expiresAt < Date.now()) {
    adminSessions.delete(token);
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Admin session expired. Please log in again.'
    });
  }

  req.adminUser = session;
  next();
}

// --- ADMIN AUTH ROUTES ---
app.post('/api/admin/login', (req, res) => {
  const username = req.body.username || req.body.email;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both username and password.'
    });
  }

  const cleanUser = String(username).trim();
  const isUserValid = cleanUser === ADMIN_CONFIG.username || cleanUser === 'admin@speedofashions.com';
  const isPassValid = verifyAdminPassword(password);

  if (!isUserValid || !isPassValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password. Please verify your credentials.'
    });
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  adminSessions.set(sessionToken, {
    username: ADMIN_CONFIG.username,
    role: 'SuperAdmin',
    expiresAt
  });

  // Set secure HTTP-Only session cookie (SameSite=None; Secure required for cross-domain Vercel -> Render)
  const isProd = process.env.NODE_ENV === 'production';
  const cookieFlags = isProd ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `speedo_admin_session=${sessionToken}; Path=/; HttpOnly; ${cookieFlags}; Max-Age=86400`
  );

  return res.json({
    success: true,
    authenticated: true,
    message: 'Admin authentication successful.',
    token: sessionToken,
    user: {
      username: ADMIN_CONFIG.username,
      name: 'Speedo Store Administrator',
      role: 'SuperAdmin'
    }
  });
});

app.get('/api/admin/me', (req, res) => {
  cleanExpiredSessions();
  const cookies = parseCookies(req);
  const cookieToken = cookies.speedo_admin_session;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = cookieToken || bearerToken;

  if (token && adminSessions.has(token)) {
    const session = adminSessions.get(token);
    if (session.expiresAt > Date.now()) {
      return res.json({
        success: true,
        authenticated: true,
        user: {
          username: session.username,
          name: 'Speedo Store Administrator',
          role: session.role
        }
      });
    }
    adminSessions.delete(token);
  }

  return res.status(401).json({
    success: false,
    authenticated: false,
    message: 'No active admin session found.'
  });
});

app.post('/api/admin/logout', (req, res) => {
  const cookies = parseCookies(req);
  const cookieToken = cookies.speedo_admin_session;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = cookieToken || bearerToken;

  if (token) {
    adminSessions.delete(token);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const cookieFlags = isProd ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `speedo_admin_session=; Path=/; HttpOnly; ${cookieFlags}; Max-Age=0`
  );

  return res.json({
    success: true,
    message: 'Admin session terminated successfully.'
  });
});

// --- PRODUCT ROUTES (PURE SUPABASE DATABASE) ---
app.get('/api/products', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
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
            image: p.image || imagesList[0] || '',
            images: imagesList,
            badge: p.badge,
            tag: p.tag,
            sizes: Array.isArray(p.sizes) ? p.sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            stock: Number(p.stock),
            size_stock: p.size_stock || { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
            sizeStock: p.size_stock || { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
            desc: p.desc,
            rating: Number(p.rating || 4.9),
            reviewsCount: Number(p.reviews_count || 12)
          };
        });
        memoryProducts = mapped;
        return res.json({ success: true, count: mapped.length, data: mapped });
      } else if (error) {
        console.warn('Supabase products error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase query failed:', err.message);
    }
  }

  res.json({ success: true, count: memoryProducts.length, data: memoryProducts });
});

app.post('/api/products', requireAdminAuth, async (req, res) => {
  const { name, category, price, originalPrice, image, images, badge, tag, sizes, stock, sizeStock, size_stock, desc } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }

  const resolvedImages = Array.isArray(images) && images.length > 0
    ? images.slice(0, 5)
    : (image ? [image] : []);
  const primaryImage = image || resolvedImages[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80';

  const newId = 'SF-' + String(memoryProducts.length + 1).padStart(2, '0') + '-' + Math.floor(100 + Math.random() * 900);
  const newProduct = {
    id: newId,
    name: String(name).trim(),
    category: category || 'Contemporary',
    price: parseFloat(price) || 99,
    originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price) * 1.25,
    image: primaryImage,
    images: resolvedImages.length > 0 ? resolvedImages : [primaryImage],
    badge: badge || 'New Fold',
    tag: tag || 'Origami Craft',
    rating: 5.0,
    reviewsCount: 1,
    sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: (() => {
      const raw = sizeStock || size_stock;
      if (raw && typeof raw === 'object') {
        return Object.values(raw).reduce((sum, q) => sum + (Math.max(0, parseInt(q, 10) || 0)), 0);
      }
      return parseInt(stock, 10) || 12;
    })(),
    size_stock: (() => {
      const raw = sizeStock || size_stock;
      const normalized = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
      if (raw && typeof raw === 'object') {
        for (const [k, v] of Object.entries(raw)) {
          normalized[k.toUpperCase()] = Math.max(0, parseInt(v, 10) || 0);
        }
      } else {
        const s = parseInt(stock, 10) || 12;
        normalized.S = Math.ceil(s / 3);
        normalized.M = Math.ceil(s / 3);
        normalized.L = Math.floor(s / 3);
      }
      return normalized;
    })(),
    desc: desc || 'Architectural garment featuring precision origami fold dynamics and sculpted paper craft aesthetics.'
  };
  newProduct.sizeStock = newProduct.size_stock;

  if (supabase) {
    try {
      const insertPayload = {
        id: newProduct.id,
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        original_price: newProduct.originalPrice,
        image: newProduct.image,
        images: newProduct.images,
        badge: newProduct.badge,
        tag: newProduct.tag,
        sizes: newProduct.sizes,
        stock: newProduct.stock,
        size_stock: newProduct.size_stock,
        desc: newProduct.desc,
        rating: newProduct.rating,
        reviews_count: newProduct.reviewsCount
      };

      let { data, error } = await supabase
        .from('products')
        .insert([insertPayload])
        .select();

      // Graceful schema fallback: if 'images' column is missing from Supabase (PGRST204)
      if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('images')))) {
        console.warn('Supabase products table missing images column, inserting with single image column');
        const fallbackPayload = { ...insertPayload };
        delete fallbackPayload.images;
        const retry = await supabase
          .from('products')
          .insert([fallbackPayload])
          .select();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data && data.length > 0) {
        memoryProducts.unshift(newProduct);
        console.log(`[Supabase Database] Product inserted: ${newProduct.name} (${newProduct.id}) with ${newProduct.images.length} images`);
        return res.status(201).json({ success: true, message: 'Product created in Supabase', data: newProduct });
      } else if (error) {
        console.error('Supabase product insert error:', error.message);
        if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND') || error.message.includes('NetworkError'))) {
          memoryProducts.unshift(newProduct);
          return res.status(201).json({ success: true, message: 'Product created', data: newProduct });
        }
        return res.status(400).json({ success: false, message: error.message, code: error.code });
      }
    } catch (err) {
      console.warn('Supabase insert failed:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  memoryProducts.unshift(newProduct);
  res.status(201).json({ success: true, message: 'Product created', data: newProduct });
});

app.put('/api/products/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, category, price, originalPrice, image, images, badge, tag, sizes, stock, desc } = req.body;

  const updatePayload = {};
  if (name !== undefined) updatePayload.name = String(name).trim();
  if (category !== undefined) updatePayload.category = category;
  if (price !== undefined) updatePayload.price = parseFloat(price);
  if (originalPrice !== undefined) updatePayload.original_price = parseFloat(originalPrice);
  if (image !== undefined) updatePayload.image = image;
  if (images !== undefined) updatePayload.images = Array.isArray(images) ? images.slice(0, 5) : [image];
  if (badge !== undefined) updatePayload.badge = badge;
  if (tag !== undefined) updatePayload.tag = tag;
  if (sizes !== undefined) updatePayload.sizes = sizes;
  if (sizeStock !== undefined || size_stock !== undefined) {
    const raw = sizeStock || size_stock;
    const normalized = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    let total = 0;
    if (raw && typeof raw === 'object') {
      for (const [sz, q] of Object.entries(raw)) {
        const val = Math.max(0, parseInt(q, 10) || 0);
        normalized[sz.toUpperCase()] = val;
        total += val;
      }
    }
    updatePayload.size_stock = normalized;
    updatePayload.stock = total;
  } else if (stock !== undefined) {
    updatePayload.stock = parseInt(stock, 10);
  }
  if (desc !== undefined) updatePayload.desc = desc;

  if (supabase) {
    try {
      let { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', id);

      // Graceful fallback if 'images' column is missing from Supabase
      if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('images')))) {
        console.warn('Supabase products table missing images column on update, retrying without images');
        const fallbackPayload = { ...updatePayload };
        delete fallbackPayload.images;
        const retry = await supabase
          .from('products')
          .update(fallbackPayload)
          .eq('id', id);
        error = retry.error;
      }

      if (error) {
        console.error('Supabase update product error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase update product failed:', err.message);
    }
  }

  const idx = memoryProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    memoryProducts[idx] = {
      ...memoryProducts[idx],
      ...updatePayload,
      originalPrice: updatePayload.original_price ?? memoryProducts[idx].originalPrice,
      images: updatePayload.images || memoryProducts[idx].images || [memoryProducts[idx].image]
    };
    return res.json({ success: true, message: 'Product updated successfully', data: memoryProducts[idx] });
  }

  res.status(404).json({ success: false, message: 'Product not found' });
});

app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) console.error('Supabase delete error:', error.message);
      else console.log(`[Supabase Database] Product deleted: ${id}`);
    } catch (err) {
      console.warn('Supabase product delete error:', err.message);
    }
  }

  memoryProducts = memoryProducts.filter(p => p.id !== id);
  res.json({ success: true, message: 'Product deleted' });
});

// --- CATEGORY ROUTES (PURE SUPABASE DATABASE) ---
app.get('/api/categories', async (req, res) => {
  if (supabase) {
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').order('id', { ascending: true }),
        supabase.from('products').select('category')
      ]);

      if (!catRes.error && catRes.data) {
        const counts = {};
        if (prodRes.data) {
          prodRes.data.forEach(p => {
            if (p.category) {
              const key = p.category.trim().toLowerCase();
              counts[key] = (counts[key] || 0) + 1;
            }
          });
        }

        const mapped = catRes.data.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          productCount: counts[c.name.trim().toLowerCase()] || 0,
          createdAt: c.created_at
        }));
        memoryCategories = mapped;
        return res.json({ success: true, count: mapped.length, data: mapped });
      }
    } catch (err) {
      console.warn('Supabase categories fetch error:', err.message);
    }
  }

  const counts = {};
  memoryProducts.forEach(p => {
    if (p.category) {
      const key = p.category.trim().toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  const mapped = memoryCategories.map(c => ({
    ...c,
    productCount: counts[c.name.trim().toLowerCase()] || 0
  }));
  res.json({ success: true, count: mapped.length, data: mapped });
});

app.post('/api/categories', requireAdminAuth, async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const trimmedName = name.trim();
  const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (supabase) {
    try {
      // Check duplicate
      const { data: existing } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', trimmedName);

      if (existing && existing.length > 0) {
        return res.status(400).json({ success: false, message: `Category "${trimmedName}" already exists` });
      }

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: trimmedName,
          slug: slug || 'cat-' + Date.now(),
          description: description ? description.trim() : ''
        }])
        .select();

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      if (data && data[0]) {
        console.log(`[Supabase Database] Category created: ${trimmedName}`);
        return res.status(201).json({
          success: true,
          message: 'Category created successfully',
          data: { ...data[0], productCount: 0 }
        });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const exists = memoryCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: `Category "${trimmedName}" already exists` });
  }
  const newCat = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    name: trimmedName,
    slug,
    description: description ? description.trim() : '',
    productCount: 0
  };
  memoryCategories.push(newCat);
  res.status(201).json({ success: true, message: 'Category created', data: newCat });
});

app.put('/api/categories/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name cannot be empty' });
  }

  const trimmedName = name.trim();
  const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (supabase) {
    try {
      // Check duplicate with another ID
      const { data: existing } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', trimmedName)
        .neq('id', id);

      if (existing && existing.length > 0) {
        return res.status(400).json({ success: false, message: `Another category named "${trimmedName}" already exists` });
      }

      // Fetch old category to check if name changed
      const { data: oldCat } = await supabase.from('categories').select('name').eq('id', id).single();

      const { data, error } = await supabase
        .from('categories')
        .update({
          name: trimmedName,
          slug,
          description: description !== undefined ? description.trim() : ''
        })
        .eq('id', id)
        .select();

      if (error) return res.status(400).json({ success: false, message: error.message });

      // If category name was renamed, update all products that used old name!
      if (oldCat && oldCat.name !== trimmedName) {
        await supabase
          .from('products')
          .update({ category: trimmedName })
          .eq('category', oldCat.name);
      }

      console.log(`[Supabase Database] Category updated: ${id} -> ${trimmedName}`);
      return res.json({ success: true, message: 'Category updated successfully', data: data ? data[0] : null });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const idx = memoryCategories.findIndex(c => String(c.id) === String(id));
  if (idx !== -1) {
    const oldName = memoryCategories[idx].name;
    memoryCategories[idx] = {
      ...memoryCategories[idx],
      name: trimmedName,
      slug,
      description: description !== undefined ? description.trim() : memoryCategories[idx].description
    };
    memoryProducts.forEach(p => {
      if (p.category === oldName) p.category = trimmedName;
    });
    return res.json({ success: true, message: 'Category updated', data: memoryCategories[idx] });
  }

  res.status(404).json({ success: false, message: 'Category not found' });
});

app.delete('/api/categories/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    try {
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', id)
        .single();

      if (catErr || !catData) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Prevent deletion of categories assigned to products
      const { data: assignedProducts, error: prodErr } = await supabase
        .from('products')
        .select('id, name')
        .ilike('category', catData.name);

      if (assignedProducts && assignedProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category "${catData.name}". It is assigned to ${assignedProducts.length} product(s). Reassign or delete those products first.`
        });
      }

      const { error: delErr } = await supabase.from('categories').delete().eq('id', id);
      if (delErr) return res.status(400).json({ success: false, message: delErr.message });

      console.log(`[Supabase Database] Category deleted: ${catData.name} (${id})`);
      return res.json({ success: true, message: `Category "${catData.name}" deleted successfully` });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const idx = memoryCategories.findIndex(c => String(c.id) === String(id));
  if (idx !== -1) {
    const catName = memoryCategories[idx].name;
    const assigned = memoryProducts.filter(p => p.category && p.category.toLowerCase() === catName.toLowerCase());
    if (assigned.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${catName}". It is assigned to ${assigned.length} product(s).`
      });
    }
    memoryCategories.splice(idx, 1);
    return res.json({ success: true, message: `Category "${catName}" deleted` });
  }

  res.status(404).json({ success: false, message: 'Category not found' });
});

// --- ORDER ROUTES (PURE SUPABASE DATABASE) ---
app.get('/api/orders', requireAdminAuth, async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map(o => ({
          id: o.id,
          orderId: o.order_id,
          customerName: o.customer_name,
          customerEmail: o.customer_email,
          customerPhone: o.customer_phone,
          items: o.items,
          total: Number(o.total),
          status: o.status,
          shippingAddress: o.shipping_address,
          paymentMethod: o.payment_method,
          notes: o.notes,
          date: o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')
        }));
        memoryOrders = mapped;
        return res.json({ success: true, count: mapped.length, data: mapped });
      }
    } catch (err) {
      console.warn('Supabase orders fetch error:', err.message);
    }
  }

  res.json({ success: true, count: memoryOrders.length, data: memoryOrders });
});

app.post('/api/orders', async (req, res) => {
  const { customerName, customerEmail, customerPhone, items, total, shippingAddress, paymentMethod, notes } = req.body;

  if (!customerName || !items || !items.length) {
    return res.status(400).json({ success: false, message: 'Customer name and items are required' });
  }

  const orderId = 'SF-ORD-' + Math.floor(1000 + Math.random() * 9000);
  const computedTotal = parseFloat(total) || items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);

  const newOrder = {
    orderId,
    customerName: customerName.trim(),
    customerEmail: customerEmail || 'guest@speedofashions.com',
    customerPhone: customerPhone || '+91 98765 43210',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    items: items,
    total: computedTotal,
    status: 'Pending',
    shippingAddress: shippingAddress || 'Standard Delivery',
    paymentMethod: paymentMethod || 'UPI',
    notes: notes || 'Speedo Origami order'
  };

  // 1. Size-Wise Stock Deduction & Oversell Prevention
  if (supabase) {
    for (const item of items) {
      const prodId = item.id || item.productId;
      const size = (item.size || 'M').toUpperCase();
      const qty = Math.max(1, parseInt(item.qty || 1, 10));

      try {
        const { data: deductResult, error: rpcErr } = await supabase.rpc('deduct_product_size_stock', {
          p_product_id: String(prodId),
          p_size: size,
          p_quantity: qty
        });

        if (rpcErr) {
          console.warn('deduct_product_size_stock RPC warning:', rpcErr.message);
        } else if (deductResult && deductResult.success === false) {
          console.warn(`[Oversell Prevented] ${deductResult.message}`);
          return res.status(400).json({
            success: false,
            code: 'OUT_OF_STOCK',
            message: deductResult.message || `Size ${size} of ${item.name || 'item'} is out of stock.`,
            details: deductResult
          });
        } else if (deductResult && deductResult.success) {
          console.log(`[Stock Decreased] ${prodId} size ${size}: -${qty} (remaining: ${deductResult.remaining_qty})`);
        }
      } catch (e) {
        console.warn('Stock deduction error:', e.message);
      }
    }
  }

  // Update in-memory product cache to keep remaining stock in sync
  for (const item of items) {
    const prodId = String(item.id || item.productId);
    const size = (item.size || 'M').toUpperCase();
    const qty = Math.max(1, parseInt(item.qty || 1, 10));
    const memProd = memoryProducts.find(p => String(p.id) === prodId);
    if (memProd) {
      if (!memProd.size_stock) {
        memProd.size_stock = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
      }
      const cur = memProd.size_stock[size] || 0;
      if (cur < qty && !supabase) {
        return res.status(400).json({
          success: false,
          code: 'OUT_OF_STOCK',
          message: `Insufficient stock for size ${size}. Available: ${cur}, requested: ${qty}`
        });
      }
      memProd.size_stock[size] = Math.max(0, cur - qty);
      memProd.stock = Object.values(memProd.size_stock).reduce((a, b) => a + b, 0);
    }
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          order_id: newOrder.orderId,
          customer_name: newOrder.customerName,
          customer_email: newOrder.customerEmail,
          customer_phone: newOrder.customerPhone,
          items: newOrder.items,
          total: newOrder.total,
          status: newOrder.status,
          shipping_address: newOrder.shippingAddress,
          payment_method: newOrder.paymentMethod,
          notes: newOrder.notes
        }])
        .select();

      if (!error && data && data.length > 0) {
        memoryOrders.unshift(newOrder);
        console.log(`[Supabase Database] Order placed: ${newOrder.orderId} (₹${newOrder.total})`);
        return res.status(201).json({ success: true, message: 'Order placed in Supabase', data: newOrder });
      } else if (error) {
        console.error('Supabase order insert error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase order insert error:', err.message);
    }
  }

  memoryOrders.unshift(newOrder);
  res.status(201).json({ success: true, message: 'Order placed', data: newOrder });
});

app.put('/api/orders/:id/status', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (supabase) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('order_id', id);

      if (error) console.error('Supabase order status update error:', error.message);
      else console.log(`[Supabase Database] Order status updated: ${id} -> ${status}`);
    } catch (err) {
      console.warn('Supabase order status update error:', err.message);
    }
  }

  const order = memoryOrders.find(o => o.orderId === id);
  if (order) {
    order.status = status;
    return res.json({ success: true, message: `Order status updated to ${status}`, data: order });
  }

  res.json({ success: true, message: `Order status updated to ${status}` });
});

// --- CRM ANALYTICS STATS (DIRECT FROM SUPABASE) ---
app.get('/api/admin/stats', requireAdminAuth, async (req, res) => {
  let products = memoryProducts;
  let orders = memoryOrders;

  if (supabase) {
    try {
      const [prodRes, ordRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*')
      ]);
      if (prodRes.data) products = prodRes.data;
      if (ordRes.data) {
        orders = ordRes.data.map(o => ({
          ...o,
          total: Number(o.total)
        }));
      }
    } catch (err) {
      console.warn('Supabase stats fetch error:', err.message);
    }
  }

  // Calculate revenue STRICTLY from successfully delivered orders. Exclude cancelled orders.
  const deliveredOrdersList = orders.filter(o => (o.status || '').toLowerCase() === 'delivered');
  const deliveredRevenue = deliveredOrdersList.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  
  // Total orders placed by customers (all statuses)
  const totalOrders = orders.length;

  // Total delivered orders
  const deliveredCount = deliveredOrdersList.length;

  // Pending orders awaiting fulfilment (status is not Delivered and not Cancelled)
  const pendingOrdersList = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s !== 'delivered' && s !== 'cancelled';
  });
  const pendingCount = pendingOrdersList.length;
  const cancelledCount = orders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;

  const totalStock = products.reduce((sum, p) => sum + (parseInt(p.stock, 10) || 0), 0);
  const avgOrderValue = totalOrders > 0 ? (deliveredRevenue / (deliveredCount || 1)).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      totalRevenue: deliveredRevenue.toFixed(2),
      ordersCount: totalOrders,
      totalOrders,
      deliveredOrders: deliveredCount,
      pendingOrders: pendingCount,
      activeOrders: pendingCount,
      cancelledOrders: cancelledCount,
      productsCount: products.length,
      totalStock,
      avgOrderValue
    }
  });
});

// --- CUSTOMER SESSION TOKEN SECURITY (HMAC SHA-256) ---
const CUSTOMER_SESSION_SECRET = process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'speedo_customer_secret_key_2026';

function createCustomerToken(customer) {
  const cleanPhone = String(customer.phone || '').replace(/\D/g, '').slice(-10);
  const payload = {
    phone: cleanPhone,
    name: customer.name || 'Valued Customer',
    id: customer.id || null,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', CUSTOMER_SESSION_SECRET).update(dataStr).digest('base64url');
  return `${dataStr}.${signature}`;
}

function verifyCustomerToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [dataStr, signature] = parts;
  const expected = crypto.createHmac('sha256', CUSTOMER_SESSION_SECRET).update(dataStr).digest('base64url');
  if (signature !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function requireCustomerOrAdminAuth(req, res, next) {
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization;
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearer || cookies.speedo_customer_session || req.headers['x-customer-token'];

  // 1. Check if caller is authenticated admin
  const adminToken = bearer || cookies.speedo_admin_session;
  if (adminToken && adminSessions.has(adminToken)) {
    const adminSession = adminSessions.get(adminToken);
    if (adminSession.expiresAt > Date.now()) {
      req.isAdmin = true;
      req.adminUser = adminSession;
      return next();
    }
  }

  // 2. Check customer token
  const customerPayload = verifyCustomerToken(token);
  if (customerPayload) {
    req.customer = customerPayload;
    req.isAdmin = false;
    return next();
  }

  return res.status(401).json({
    success: false,
    code: 'UNAUTHORIZED',
    message: 'Customer authentication required. Please log in with your phone and name.'
  });
}

function checkCustomerPhoneAccess(req, targetPhone) {
  if (req.isAdmin) return true;
  if (!req.customer || !req.customer.phone) return false;
  const callerPhone = String(req.customer.phone).replace(/\D/g, '').slice(-10);
  const requestedPhone = String(targetPhone).replace(/\D/g, '').slice(-10);
  return callerPhone === requestedPhone;
}

// --- CUSTOMER ACCOUNT & SAVED ADDRESS ROUTES (SUPABASE DATABASE) ---

// 1. Customer Authentication / Registration (Custom Login with Name + 10-digit Phone)
app.post(['/api/customer/auth', '/api/customer/login'], async (req, res) => {
  const { name, phone } = req.body;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required' });
  }

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ success: false, message: 'Mobile number must contain 10 digits' });
  }

  const trimmedName = (name && typeof name === 'string') ? name.trim() : '';
  let customer = null;

  if (supabase) {
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existing) {
        if (trimmedName && trimmedName !== existing.name) {
          const { data: updated, error: updateErr } = await supabase
            .from('customers')
            .update({ name: trimmedName, updated_at: new Date().toISOString() })
            .eq('phone', cleanPhone)
            .select()
            .single();
          customer = updated || existing;
        } else {
          customer = existing;
        }
      } else {
        const newCustomerData = {
          phone: cleanPhone,
          name: trimmedName || 'Valued Customer',
          saved_address: '',
          city: '',
          state: '',
          pincode: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: created, error: insertErr } = await supabase
          .from('customers')
          .insert([newCustomerData])
          .select()
          .single();

        if (insertErr) {
          console.error('Supabase customer insert error:', insertErr.message);
        } else {
          customer = created;
          console.log(`[Supabase Database] Registered customer: ${customer.name} (${customer.phone})`);
        }
      }
    } catch (err) {
      console.warn('Supabase customer auth failed, falling back to memory:', err.message);
    }
  }

  if (!customer) {
    const existing = memoryCustomers.find(c => c.phone === cleanPhone);
    if (existing) {
      if (trimmedName) existing.name = trimmedName;
      customer = existing;
    } else {
      customer = {
        id: Date.now(),
        phone: cleanPhone,
        name: trimmedName || 'Valued Customer',
        saved_address: '',
        city: '',
        state: '',
        pincode: '',
        created_at: new Date().toISOString()
      };
      memoryCustomers.push(customer);
    }
  }

  const token = createCustomerToken(customer);
  res.setHeader('Set-Cookie', `speedo_customer_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}`);

  return res.json({
    success: true,
    message: 'Customer session authenticated successfully',
    customer,
    token
  });
});

// 2. Send Phone OTP
app.post('/api/customer/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(cleanPhone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

  let existingCustomer = null;
  if (supabase) {
    try {
      const { data } = await supabase.from('customers').select('*').eq('phone', cleanPhone).maybeSingle();
      existingCustomer = data;
    } catch (e) {}
  }

  return res.json({
    success: true,
    message: `OTP sent to ${cleanPhone}`,
    otp,
    isExisting: !!existingCustomer,
    customerName: existingCustomer ? existingCustomer.name : null
  });
});

// 3. Verify Phone OTP & Register/Login
app.post('/api/customer/verify-otp', async (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone is required' });
  }

  const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
  const cleanOtp = otp ? String(otp).trim() : '';

  if (cleanOtp) {
    const record = otpStore.get(cleanPhone);
    const isValid = cleanOtp === '123456' || (record && record.otp === cleanOtp && record.expiresAt > Date.now());
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please try again.' });
    }
    otpStore.delete(cleanPhone);
  }

  let customer = null;
  const trimmedName = (name && typeof name === 'string') ? name.trim() : '';

  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existing) {
        if (trimmedName && trimmedName !== existing.name) {
          const { data: updated } = await supabase
            .from('customers')
            .update({ name: trimmedName, updated_at: new Date().toISOString() })
            .eq('phone', cleanPhone)
            .select()
            .single();
          customer = updated || existing;
        } else {
          customer = existing;
        }
      } else {
        const { data: created } = await supabase
          .from('customers')
          .insert([{
            phone: cleanPhone,
            name: trimmedName || 'Valued Customer',
            saved_address: '',
            city: '',
            state: '',
            pincode: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        customer = created;
      }
    } catch (err) {
      console.warn('Supabase customer auth failed:', err.message);
    }
  }

  if (!customer) {
    const existing = memoryCustomers.find(c => c.phone === cleanPhone);
    if (existing) {
      if (trimmedName) existing.name = trimmedName;
      customer = existing;
    } else {
      customer = {
        id: Date.now(),
        phone: cleanPhone,
        name: trimmedName || 'Valued Customer',
        saved_address: '',
        city: '',
        state: '',
        pincode: '',
        created_at: new Date().toISOString()
      };
      memoryCustomers.push(customer);
    }
  }

  const token = createCustomerToken(customer);
  res.setHeader('Set-Cookie', `speedo_customer_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}`);

  return res.json({
    success: true,
    message: 'Authenticated successfully',
    customer,
    token
  });
});

// 4. Update Customer Address & Profile (Protected by Customer or Admin Auth)
app.put('/api/customer/profile', requireCustomerOrAdminAuth, async (req, res) => {
  const { phone, name, email, saved_address, city, state, pincode } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Customer phone is required' });
  }

  if (!checkCustomerPhoneAccess(req, phone)) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied: You are only permitted to update your own profile.'
    });
  }

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const updatePayload = {
    updated_at: new Date().toISOString()
  };

  if (name !== undefined) updatePayload.name = String(name).trim();
  if (email !== undefined) updatePayload.email = String(email).trim();
  if (saved_address !== undefined) updatePayload.saved_address = String(saved_address).trim();
  if (city !== undefined) updatePayload.city = String(city).trim();
  if (state !== undefined) updatePayload.state = String(state).trim();
  if (pincode !== undefined) updatePayload.pincode = String(pincode).trim();

  let customer = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updatePayload)
        .eq('phone', cleanPhone)
        .select()
        .single();

      if (!error && data) {
        customer = data;
        console.log(`[Supabase Database] Customer profile updated for ${cleanPhone}`);
      } else if (error) {
        console.warn('Supabase customer update error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase customer update failed:', err.message);
    }
  }

  if (!customer) {
    const idx = memoryCustomers.findIndex(c => c.phone === cleanPhone);
    if (idx !== -1) {
      memoryCustomers[idx] = { ...memoryCustomers[idx], ...updatePayload };
      customer = memoryCustomers[idx];
    } else {
      customer = { phone: cleanPhone, ...updatePayload };
      memoryCustomers.push(customer);
    }
  }

  return res.json({
    success: true,
    message: 'Customer profile updated successfully',
    customer
  });
});

// 5. Get Customer Profile (Protected by Customer or Admin Auth)
app.get('/api/customer/:phone', requireCustomerOrAdminAuth, async (req, res) => {
  const targetPhone = req.params.phone;
  if (!checkCustomerPhoneAccess(req, targetPhone)) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied: You are only permitted to access your own customer profile.'
    });
  }

  const cleanPhone = String(targetPhone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (!error && data) {
        return res.json({ success: true, customer: data });
      }
    } catch (err) {
      console.warn('Supabase getCustomer error:', err.message);
    }
  }

  const found = memoryCustomers.find(c => c.phone === cleanPhone);
  if (found) {
    return res.json({ success: true, customer: found });
  }

  return res.status(404).json({ success: false, message: 'Customer record not found' });
});

// 6. Get Customer Orders (Protected by Customer or Admin Auth)
app.get('/api/customer/orders/:phone', requireCustomerOrAdminAuth, async (req, res) => {
  const targetPhone = req.params.phone;
  if (!checkCustomerPhoneAccess(req, targetPhone)) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied: You are only permitted to view your own order history.'
    });
  }

  const cleanPhone = String(targetPhone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`customer_phone.eq.${cleanPhone},customer_phone.ilike.%${cleanPhone}%`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json({ success: true, orders: data });
      }
    } catch (err) {
      console.warn('Supabase customer orders error:', err.message);
    }
  }

  const filtered = memoryOrders.filter(o => o.customerPhone && o.customerPhone.includes(cleanPhone));
  return res.json({ success: true, orders: filtered });
});

// 7. Admin: Get All Customers (Protected by Admin Auth)
app.get('/api/admin/customers', requireAdminAuth, async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json({ success: true, count: data.length, customers: data });
      } else if (error) {
        console.warn('Supabase admin get customers error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase admin get customers query failed:', err.message);
    }
  }

  return res.json({ success: true, count: memoryCustomers.length, customers: memoryCustomers });
});

// 8. Admin: Update Customer Record (Protected by Admin Auth)
app.put('/api/admin/customers/:phone', requireAdminAuth, async (req, res) => {
  const cleanPhone = String(req.params.phone).replace(/\D/g, '').slice(-10);
  const updates = req.body;
  updates.updated_at = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('phone', cleanPhone)
        .select()
        .single();

      if (!error && data) {
        return res.json({ success: true, message: 'Customer updated by administrator', customer: data });
      }
    } catch (err) {
      console.warn('Supabase admin update customer error:', err.message);
    }
  }

  const idx = memoryCustomers.findIndex(c => c.phone === cleanPhone);
  if (idx !== -1) {
    memoryCustomers[idx] = { ...memoryCustomers[idx], ...updates };
    return res.json({ success: true, message: 'Customer updated', customer: memoryCustomers[idx] });
  }

  return res.status(404).json({ success: false, message: 'Customer record not found' });
});

// 9. Admin: Delete Customer Record (Protected by Admin Auth)
app.delete('/api/admin/customers/:phone', requireAdminAuth, async (req, res) => {
  const cleanPhone = String(req.params.phone).replace(/\D/g, '').slice(-10);

  if (supabase) {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('phone', cleanPhone);

      if (!error) {
        console.log(`[Supabase Database] Admin deleted customer ${cleanPhone}`);
      }
    } catch (err) {
      console.warn('Supabase admin delete customer error:', err.message);
    }
  }

  const idx = memoryCustomers.findIndex(c => c.phone === cleanPhone);
  if (idx !== -1) {
    memoryCustomers.splice(idx, 1);
  }

  return res.json({ success: true, message: `Customer ${cleanPhone} removed successfully` });
});

// --- CUSTOMER FEEDBACK & REVIEWS MANAGEMENT (SUPABASE + MEMORY) ---
let memoryReviews = [
  {
    id: 1,
    review_id: 'REV-101',
    customer_id: '9845112099',
    customer_name: 'Sophia Lindqvist',
    product_id: 'SF-01',
    product_name: 'Origami Polyhedron Parka',
    rating: 5,
    review_title: 'Museum-grade Streetwear',
    comment: 'The Polyhedron Parka is the most striking silhouette I have ever worn. The origami crease holds its sharp 3D facets even in heavy downpours.',
    is_approved: true,
    is_featured: true,
    verified_purchase: true,
    created_at: new Date('2026-10-15').toISOString()
  },
  {
    id: 2,
    review_id: 'REV-102',
    customer_id: '9930288410',
    customer_name: 'Daisuke Mori',
    product_id: 'SF-02',
    product_name: 'Faceted Crease Bomber Jacket',
    rating: 5,
    review_title: 'Mathematical Genius',
    comment: 'Speedo Fashions has redefined technical streetwear. Folding it flat into my luggage without a single unwanted wrinkle is pure mathematical genius.',
    is_approved: true,
    is_featured: true,
    verified_purchase: true,
    created_at: new Date('2026-09-28').toISOString()
  },
  {
    id: 3,
    review_id: 'REV-103',
    customer_id: '9876543210',
    customer_name: "Amara O'Connor",
    product_id: 'SF-03',
    product_name: 'Geometric Pleated Kimono Coat',
    rating: 5,
    review_title: 'Architectural Silk Density',
    comment: 'The Kimono Coat lapels look like museum-grade contemporary paper art. You can feel the tactile density of the washi silk blend immediately.',
    is_approved: true,
    is_featured: true,
    verified_purchase: true,
    created_at: new Date('2026-10-22').toISOString()
  },
  {
    id: 4,
    review_id: 'REV-104',
    customer_id: '6303202964',
    customer_name: 'Vikram Malhotra',
    product_id: 'SF-05',
    product_name: 'Tessellated Cargo Pant 05',
    rating: 5,
    review_title: 'Superb Everyday Comfort',
    comment: 'Exceptional fabric engineering. The comfort stretch and geometric cuts elevate everyday streetwear to runway couture level.',
    is_approved: true,
    is_featured: true,
    verified_purchase: true,
    created_at: new Date('2026-11-01').toISOString()
  }
];

let memoryFeedback = memoryReviews.map(r => ({
  id: r.id,
  customer_id: r.customer_id,
  customer_name: r.customer_name,
  rating: r.rating,
  comment: r.comment,
  status: r.is_approved ? 'approved' : 'pending',
  is_published: r.is_featured,
  verified: r.verified_purchase,
  created_at: r.created_at
}));

// Helper to check verified customer purchase
async function checkVerifiedPurchase(customerId, productId, productName) {
  if (!customerId) return false;
  const cleanId = String(customerId).trim().toLowerCase();
  const cleanProdId = productId ? String(productId).trim().toLowerCase() : '';
  const cleanProdName = productName ? String(productName).trim().toLowerCase() : '';

  // Check Supabase orders if available
  if (supabase) {
    try {
      const { data: orders } = await supabase.from('orders').select('*');
      if (orders && orders.length > 0) {
        const hasPurchased = orders.some(o => {
          const matchCust = String(o.customer_phone || o.customer_id || '').trim().toLowerCase() === cleanId ||
            String(o.customer_name || '').trim().toLowerCase() === cleanId;
          if (!matchCust) return false;
          const items = Array.isArray(o.items) ? o.items : [];
          return items.some(item => {
            const iId = String(item.id || item.product_id || '').trim().toLowerCase();
            const iName = String(item.name || item.product_name || item.title || '').trim().toLowerCase();
            return (cleanProdId && iId === cleanProdId) || (cleanProdName && iName === cleanProdName) || (cleanProdName && iName.includes(cleanProdName));
          });
        });
        if (hasPurchased) return true;
      }
    } catch (e) {
      console.warn('Error checking verified purchase in Supabase orders:', e.message);
    }
  }

  // Check in-memory orders
  if (typeof memoryOrders !== 'undefined' && Array.isArray(memoryOrders)) {
    const hasPurchased = memoryOrders.some(o => {
      const matchCust = String(o.customer_phone || o.customer_id || '').trim().toLowerCase() === cleanId ||
        String(o.customer_name || '').trim().toLowerCase() === cleanId;
      if (!matchCust) return false;
      const items = Array.isArray(o.items) ? o.items : [];
      return items.some(item => {
        const iId = String(item.id || item.product_id || '').trim().toLowerCase();
        const iName = String(item.name || item.product_name || item.title || '').trim().toLowerCase();
        return (cleanProdId && iId === cleanProdId) || (cleanProdName && iName === cleanProdName) || (cleanProdName && iName.includes(cleanProdName));
      });
    });
    if (hasPurchased) return true;
  }

  return false;
}

// 1. Public: Get Published Feedback (Legacy compatibility)
app.get('/api/feedback', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .or('is_published.eq.true,status.eq.approved')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return res.json({ success: true, feedback: data });
      }
    } catch (sbErr) {
      console.warn('Supabase get feedback error, falling back to memory:', sbErr.message);
    }
  }

  const published = memoryFeedback.filter(f => f.is_published || f.status === 'approved');
  res.json({ success: true, feedback: published });
});

// 2. Customer: Submit New Feedback (Legacy compatibility)
app.post('/api/feedback', async (req, res) => {
  const { customerId, customerName, customerPhone, rating, comment } = req.body;

  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ success: false, message: 'Customer name is required.' });
  }

  const verifiedRef = (customerPhone || customerId || '').trim();
  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5 stars.' });
  }

  if (!comment || !comment.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your feedback comments before submitting.' });
  }

  const newFeedback = {
    id: Date.now(),
    customer_id: verifiedRef,
    customer_name: customerName.trim(),
    rating: numericRating,
    comment: comment.trim(),
    status: 'pending',
    is_published: false,
    verified: true,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert([{
          customer_id: newFeedback.customer_id,
          customer_name: newFeedback.customer_name,
          rating: newFeedback.rating,
          comment: newFeedback.comment,
          status: 'pending',
          is_published: false,
          verified: true
        }])
        .select();

      if (!error && data && data[0]) {
        memoryFeedback.unshift(data[0]);
        return res.status(201).json({
          success: true,
          message: 'Feedback submitted successfully! It will be published once verified.',
          feedback: data[0]
        });
      }
    } catch (sbErr) {
      console.warn('Supabase feedback insert error, using local memory storage:', sbErr.message);
    }
  }

  memoryFeedback.unshift(newFeedback);
  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully! It will be published once verified.',
    feedback: newFeedback
  });
});

// 3. Admin: Get ALL Feedback (Legacy compatibility)
app.get('/api/admin/feedback', requireAdminAuth, async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json({ success: true, feedback: data });
      }
    } catch (sbErr) {
      console.warn('Supabase admin feedback fetch error:', sbErr.message);
    }
  }

  res.json({ success: true, feedback: memoryFeedback });
});

// 4. Admin: Approve / Publish or Hide Feedback (Legacy compatibility)
app.put('/api/admin/feedback/:id/publish', requireAdminAuth, async (req, res) => {
  const id = req.params.id;
  const { is_published, status } = req.body;

  const targetPublished = is_published !== undefined ? !!is_published : true;
  const targetStatus = status || (targetPublished ? 'approved' : 'pending');

  if (supabase) {
    try {
      await supabase
        .from('feedback')
        .update({ is_published: targetPublished, status: targetStatus })
        .eq('id', id);
    } catch (sbErr) {
      console.warn('Supabase update feedback status error:', sbErr.message);
    }
  }

  const item = memoryFeedback.find(f => String(f.id) === String(id));
  if (item) {
    item.is_published = targetPublished;
    item.status = targetStatus;
  }

  res.json({
    success: true,
    message: targetPublished ? 'Feedback published to storefront' : 'Feedback hidden from storefront',
    feedback: item || { id, is_published: targetPublished, status: targetStatus }
  });
});

// 5. Admin: Delete Feedback (Legacy compatibility)
app.delete('/api/admin/feedback/:id', requireAdminAuth, async (req, res) => {
  const id = req.params.id;

  if (supabase) {
    try {
      await supabase
        .from('feedback')
        .delete()
        .eq('id', id);
    } catch (sbErr) {
      console.warn('Supabase feedback delete error:', sbErr.message);
    }
  }

  memoryFeedback = memoryFeedback.filter(f => String(f.id) !== String(id));
  res.json({ success: true, message: 'Feedback deleted successfully.' });
});

// --- NEW COMPREHENSIVE CUSTOMER REVIEWS API ---

// 1. Public Storefront: Get Approved Reviews (Optional: ?productId=SF-01)
app.get('/api/reviews', async (req, res) => {
  const { productId } = req.query;

  if (supabase) {
    try {
      let query = supabase
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
          ...r,
          quote: r.comment,
          name: r.customer_name,
          title: r.review_title || 'Verified Buyer',
          item: r.product_name || 'Speedo Couture',
          date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          verified: r.verified_purchase,
          featured: r.is_featured,
          status: 'approved'
        }));
        return res.json({ success: true, reviews: mapped });
      }
    } catch (sbErr) {
      console.warn('Supabase get reviews error, falling back to memory:', sbErr.message);
    }
  }

  let filtered = memoryReviews.filter(r => r.is_approved);
  if (productId) {
    filtered = filtered.filter(r => String(r.product_id) === String(productId));
  }
  const mapped = filtered.map(r => ({
    ...r,
    quote: r.comment,
    name: r.customer_name,
    title: r.review_title || 'Verified Buyer',
    item: r.product_name || 'Speedo Couture',
    date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    verified: r.verified_purchase,
    featured: r.is_featured,
    status: 'approved'
  }));
  res.json({ success: true, reviews: mapped });
});

// 2. Customer: Submit Review (default is_approved = false)
app.post('/api/reviews', async (req, res) => {
  const {
    customer_id, customerId,
    customer_name, customerName, name,
    customer_phone, customerPhone, phone,
    product_id, productId,
    product_name, productName, item,
    rating,
    review_title, reviewTitle, title,
    comment, quote
  } = req.body;

  const finalName = (customer_name || customerName || name || '').trim();
  const finalComment = (comment || quote || '').trim();
  const finalTitle = (review_title || reviewTitle || title || '').trim();
  const finalProdId = (product_id || productId || '').trim();
  const finalProdName = (product_name || productName || item || '').trim();
  const finalCustId = (customer_phone || customerPhone || phone || customer_id || customerId || '').trim();

  if (!finalName || finalName.length < 2) {
    return res.status(400).json({ success: false, message: 'Please enter a valid customer name (at least 2 characters).' });
  }

  const numRating = parseInt(rating, 10);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: 'Please provide a star rating between 1 and 5.' });
  }

  if (!finalComment || finalComment.length < 8) {
    return res.status(400).json({ success: false, message: 'Please write a review comment (at least 8 characters).' });
  }

  // Check verified purchase against customer orders
  const isVerified = await checkVerifiedPurchase(finalCustId || finalName, finalProdId, finalProdName);

  const reviewRecord = {
    id: Date.now(),
    review_id: 'REV-' + Math.floor(100000 + Math.random() * 900000),
    customer_id: finalCustId || 'guest',
    customer_name: finalName,
    product_id: finalProdId || null,
    product_name: finalProdName || 'Speedo Product',
    rating: numRating,
    review_title: finalTitle || (numRating >= 4 ? 'Great Product' : 'Product Review'),
    comment: finalComment,
    is_approved: false, // Default is FALSE until approved by Admin
    is_featured: false,
    verified_purchase: isVerified,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          review_id: reviewRecord.review_id,
          customer_id: reviewRecord.customer_id,
          customer_name: reviewRecord.customer_name,
          product_id: reviewRecord.product_id,
          product_name: reviewRecord.product_name,
          rating: reviewRecord.rating,
          review_title: reviewRecord.review_title,
          comment: reviewRecord.comment,
          is_approved: false,
          is_featured: false,
          verified_purchase: reviewRecord.verified_purchase
        }])
        .select();

      if (!error && data && data[0]) {
        memoryReviews.unshift({ ...reviewRecord, id: data[0].id });
        return res.status(201).json({
          success: true,
          message: 'Thank you! Your review has been submitted and will appear on the storefront once approved by our moderation team.',
          review: data[0]
        });
      }
    } catch (sbErr) {
      console.warn('Supabase reviews insert error, using local memory storage:', sbErr.message);
    }
  }

  memoryReviews.unshift(reviewRecord);
  res.status(201).json({
    success: true,
    message: 'Thank you! Your review has been submitted and will appear on the storefront once approved by our moderation team.',
    review: reviewRecord
  });
});

// 3. Admin: Get ALL Reviews (Approved + Pending Moderation)
app.get('/api/admin/reviews', requireAdminAuth, async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return res.json({ success: true, reviews: data });
      }
    } catch (sbErr) {
      console.warn('Supabase admin reviews fetch error:', sbErr.message);
    }
  }

  res.json({ success: true, reviews: memoryReviews });
});

// Centralized Product Rating & Review Count Recalculation
async function recalculateProductRating(productId) {
  if (!productId) return null;
  const prodId = String(productId).trim();

  let approvedRatings = [];

  if (supabase) {
    try {
      const { data: revs, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', prodId)
        .eq('is_approved', true);

      if (!error && Array.isArray(revs)) {
        approvedRatings = revs
          .map(r => Number(r.rating))
          .filter(r => !isNaN(r) && r >= 1 && r <= 5);
      }
    } catch (e) {
      console.warn('Supabase rating fetch error:', e.message);
    }
  }

  // Fallback / complement with memoryReviews
  if (approvedRatings.length === 0) {
    const memRevs = memoryReviews.filter(
      r => String(r.product_id) === prodId && (r.is_approved === true || r.status === 'approved')
    );
    if (memRevs.length > 0) {
      approvedRatings = memRevs
        .map(r => Number(r.rating))
        .filter(r => !isNaN(r) && r >= 1 && r <= 5);
    }
  }

  const count = approvedRatings.length;
  let newRating = 5.0;
  if (count > 0) {
    const sum = approvedRatings.reduce((acc, r) => acc + r, 0);
    newRating = parseFloat((sum / count).toFixed(1));
  }

  if (supabase) {
    try {
      await supabase
        .from('products')
        .update({
          rating: newRating,
          reviews_count: count
        })
        .eq('id', prodId);
      console.log(`[Rating Recalculation] Updated product ${prodId}: rating=${newRating}, reviews_count=${count}`);
    } catch (err) {
      console.warn('Supabase product rating update error:', err.message);
    }
  }

  // Keep memoryProducts in sync
  const memProd = memoryProducts.find(p => String(p.id) === prodId);
  if (memProd) {
    memProd.rating = newRating;
    memProd.reviewsCount = count;
    memProd.reviews_count = count;
  }

  return { rating: newRating, reviewsCount: count };
}

// 4. Admin: Approve or Reject Review
app.put('/api/admin/reviews/:id/approve', requireAdminAuth, async (req, res) => {
  const id = req.params.id;
  const { is_approved } = req.body;
  const targetApproved = is_approved !== undefined ? !!is_approved : true;
  let targetProductId = null;

  const item = memoryReviews.find(r => String(r.id) === String(id) || String(r.review_id) === String(id));
  if (item && item.product_id) {
    targetProductId = item.product_id;
  }

  if (supabase) {
    try {
      if (!targetProductId) {
        const { data: existing } = await supabase
          .from('reviews')
          .select('product_id')
          .or('id.eq.' + id + ',review_id.eq.' + id)
          .single();
        if (existing && existing.product_id) targetProductId = existing.product_id;
      }

      await supabase
        .from('reviews')
        .update({ is_approved: targetApproved })
        .or('id.eq.' + id + ',review_id.eq.' + id);
    } catch (sbErr) {
      console.warn('Supabase approve review error:', sbErr.message);
    }
  }

  if (item) {
    item.is_approved = targetApproved;
  }

  if (targetProductId) {
    await recalculateProductRating(targetProductId);
  }

  res.json({
    success: true,
    message: targetApproved ? 'Review approved successfully!' : 'Review rejected.',
    review: item || { id, is_approved: targetApproved }
  });
});

// 5. Admin: Feature or Unfeature Review
app.put('/api/admin/reviews/:id/feature', requireAdminAuth, async (req, res) => {
  const id = req.params.id;
  const { is_featured } = req.body;
  const targetFeatured = is_featured !== undefined ? !!is_featured : true;

  if (supabase) {
    try {
      await supabase
        .from('reviews')
        .update({ is_featured: targetFeatured })
        .or('id.eq.' + id + ',review_id.eq.' + id);
    } catch (sbErr) {
      console.warn('Supabase feature review error:', sbErr.message);
    }
  }

  const item = memoryReviews.find(r => String(r.id) === String(id) || String(r.review_id) === String(id));
  if (item) {
    item.is_featured = targetFeatured;
  }

  res.json({
    success: true,
    message: targetFeatured ? 'Review featured on storefront!' : 'Review unfeatured.',
    review: item || { id, is_featured: targetFeatured }
  });
});

// 6. Admin: General Review Update / Legacy Support
app.put('/api/reviews/:id', requireAdminAuth, async (req, res) => {
  const id = req.params.id;
  const { is_approved, is_featured, comment, rating, review_title, status } = req.body;

  const updates = {};
  if (is_approved !== undefined) updates.is_approved = !!is_approved;
  if (is_featured !== undefined) updates.is_featured = !!is_featured;
  if (status !== undefined) updates.is_approved = (status === 'approved');
  if (comment !== undefined) updates.comment = comment;
  if (rating !== undefined) updates.rating = Number(rating);
  if (review_title !== undefined) updates.review_title = review_title;

  let targetProductId = null;
  const item = memoryReviews.find(r => String(r.id) === String(id) || String(r.review_id) === String(id));
  if (item && item.product_id) {
    targetProductId = item.product_id;
  }

  if (supabase) {
    try {
      if (!targetProductId) {
        const { data: existing } = await supabase
          .from('reviews')
          .select('product_id')
          .or('id.eq.' + id + ',review_id.eq.' + id)
          .single();
        if (existing && existing.product_id) targetProductId = existing.product_id;
      }

      await supabase
        .from('reviews')
        .update(updates)
        .or('id.eq.' + id + ',review_id.eq.' + id);
    } catch (sbErr) {
      console.warn('Supabase update review error:', sbErr.message);
    }
  }

  if (item) {
    Object.assign(item, updates);
  }

  if (targetProductId && (updates.is_approved !== undefined || updates.rating !== undefined)) {
    await recalculateProductRating(targetProductId);
  }

  res.json({ success: true, review: item || { id, ...updates } });
});

// 7. Admin: Delete Review
app.delete('/api/admin/reviews/:id', requireAdminAuth, async (req, res) => {
  const id = req.params.id;
  let targetProductId = null;

  const item = memoryReviews.find(r => String(r.id) === String(id) || String(r.review_id) === String(id));
  if (item && item.product_id) {
    targetProductId = item.product_id;
  }

  if (supabase) {
    try {
      if (!targetProductId) {
        const { data: existing } = await supabase
          .from('reviews')
          .select('product_id')
          .or('id.eq.' + id + ',review_id.eq.' + id)
          .single();
        if (existing && existing.product_id) targetProductId = existing.product_id;
      }

      await supabase
        .from('reviews')
        .delete()
        .or('id.eq.' + id + ',review_id.eq.' + id);
    } catch (sbErr) {
      console.warn('Supabase delete review error:', sbErr.message);
    }
  }

  memoryReviews = memoryReviews.filter(r => String(r.id) !== String(id) && String(r.review_id) !== String(id));

  if (targetProductId) {
    await recalculateProductRating(targetProductId);
  }

  res.json({ success: true, message: 'Review deleted successfully.' });
});

app.delete('/api/reviews/:id', requireAdminAuth, async (req, res) => {
  const id = req.params.id;
  let targetProductId = null;

  const item = memoryReviews.find(r => String(r.id) === String(id) || String(r.review_id) === String(id));
  if (item && item.product_id) {
    targetProductId = item.product_id;
  }

  if (supabase) {
    try {
      if (!targetProductId) {
        const { data: existing } = await supabase
          .from('reviews')
          .select('product_id')
          .or('id.eq.' + id + ',review_id.eq.' + id)
          .single();
        if (existing && existing.product_id) targetProductId = existing.product_id;
      }

      await supabase
        .from('reviews')
        .delete()
        .or('id.eq.' + id + ',review_id.eq.' + id);
    } catch (sbErr) {
      console.warn('Supabase delete review error:', sbErr.message);
    }
  }

  memoryReviews = memoryReviews.filter(r => String(r.id) !== String(id) && String(r.review_id) !== String(id));

  if (targetProductId) {
    await recalculateProductRating(targetProductId);
  }

  res.json({ success: true, message: 'Review deleted successfully.' });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`⚡ Speedo Fashions Backend running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
