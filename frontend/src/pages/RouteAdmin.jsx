import React, { useState, useEffect } from 'react';
import {
  Package, ShoppingBag, PlusCircle, CheckCircle,
  TrendingUp, RefreshCw, LogOut, ArrowLeft, Trash2, Edit3,
  Clock, MapPin, Search, X, AlertCircle, Sparkles, Filter,
  Database, Upload, Copy, Check, ShieldCheck, Layers, Tag,
  Star, MessageSquare, CheckSquare, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import ProductImageUploader from '../components/ProductImageUploader';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  uploadImageToSupabase
} from '../services/supabaseClient';

export default function RouteAdmin({
  adminUser,
  onLogout,
  onNavigateToStore,
  onProductCreated,
  onCategoriesChanged,
  categories: propCategories,
  activeSection = 'dashboard',
  onSectionChange
}) {
  // Navigation Section ('dashboard' | 'catlog' | 'reviews')
  const currentSection = activeSection || 'dashboard';

  // Sub-tabs for Clothing Catalogue
  const [catalogSubTab, setCatalogSubTab] = useState('inventory'); // 'inventory' | 'add-product' | 'categories'

  const activeTab = currentSection === 'dashboard' ? 'orders' : catalogSubTab;
  const setActiveTab = (tab) => {
    if (tab === 'orders') {
      if (onSectionChange) onSectionChange('dashboard');
    } else {
      if (onSectionChange) onSectionChange('catlog');
      setCatalogSubTab(tab);
    }
  };

  // Dashboard Data states
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');

  // Reviews management modal
  const [newReviewModal, setNewReviewModal] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    name: '',
    title: '',
    quote: '',
    item: '',
    rating: 5,
    verified: true,
    featured: true
  });

  // Categories state
  const [categories, setCategories] = useState(propCategories || []);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryMsg, setCategoryMsg] = useState({ type: '', text: '' });

  // Edit Category Modal state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  // Search & Filter states
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'published' | 'pending'

  // Image upload states
  const [isUploadingAddImg, setIsUploadingAddImg] = useState(false);
  const [isUploadingEditImg, setIsUploadingEditImg] = useState(false);
  const [uploadNotice, setUploadNotice] = useState('');

  // Supabase Configuration Modal State
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseConnected, setSupabaseConnected] = useState(isSupabaseConfigured());
  const [copiedSql, setCopiedSql] = useState(false);

  // Editing Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'Outerwear',
    price: '',
    originalPrice: '',
    stock: '',
    image: '',
    badge: '',
    tag: '',
    desc: ''
  });
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Outerwear',
    price: '',
    originalPrice: '',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
    badge: 'New Arrival',
    tag: 'Premium Cotton',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 20,
    desc: 'Contemporary tailored garment designed with precision cut geometric seams and comfort stretch.'
  });

  // Load Data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedProducts, fetchedStats, fetchedCats, fetchedReviews] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getAdminStats(),
        api.getCategories(),
        api.getAdminReviews()
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setStats(fetchedStats);
      if (fetchedCats && fetchedCats.length > 0) {
        setCategories(fetchedCats);
      }
      if (fetchedReviews) {
        setReviews(fetchedReviews);
      }
      setSupabaseConnected(isSupabaseConfigured());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
    }
  }, [propCategories]);

  useEffect(() => {
    loadDashboardData();
    const cfg = getSupabaseConfig();
    if (cfg) {
      setSupabaseUrlInput(cfg.url);
      setSupabaseKeyInput(cfg.anonKey);
    }
  }, []);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
  };
  const handleLogout = handleLogoutClick;

  // --- DYNAMIC REAL-TIME CALCULATIONS FROM ORDERS ---
  const deliveredOrdersList = orders.filter(
    (o) => (o.status || '').trim().toLowerCase() === 'delivered'
  );
  // Total Revenue: strictly from successfully delivered orders. Exclude cancelled orders.
  const calculatedRevenue = deliveredOrdersList.reduce(
    (sum, o) => sum + (parseFloat(o.total) || 0),
    0
  );
  const totalOrdersCount = orders.length;
  const deliveredOrdersCount = deliveredOrdersList.length;
  const pendingOrdersCount = orders.filter((o) => {
    const s = (o.status || '').trim().toLowerCase();
    return s !== 'delivered' && s !== 'cancelled';
  }).length;

  // --- CUSTOMER REVIEWS & FEEDBACK MANAGEMENT HANDLERS ---
  const handleToggleApproveReview = async (review) => {
    const isCurrentlyApproved = !!(review.isApproved || review.is_approved || review.status === 'approved');
    const nextApproved = !isCurrentlyApproved;
    const reviewId = review.id || review.reviewId;

    try {
      if (api.approveReview) {
        await api.approveReview(reviewId, nextApproved);
      }
      setReviews(prev => prev.map(r => (r.id === review.id || r.reviewId === review.reviewId) ? {
        ...r,
        isApproved: nextApproved,
        is_approved: nextApproved,
        status: nextApproved ? 'approved' : 'pending'
      } : r));
      setStatusNotice(
        nextApproved
          ? `Review by "${review.customerName || review.name}" approved and published on storefront.`
          : `Review by "${review.customerName || review.name}" revoked from storefront.`
      );
      setTimeout(() => setStatusNotice(''), 3000);
    } catch (err) {
      console.error('Failed to toggle review approval:', err);
      alert('Failed to update review approval');
    }
  };

  const handleToggleFeatureReview = async (review) => {
    const isCurrentlyFeatured = !!(review.featured || review.isFeatured || review.is_featured);
    const nextFeatured = !isCurrentlyFeatured;
    const reviewId = review.id || review.reviewId;

    try {
      if (api.featureReview) {
        await api.featureReview(reviewId, nextFeatured);
      }
      setReviews(prev => prev.map(r => (r.id === review.id || r.reviewId === review.reviewId) ? {
        ...r,
        featured: nextFeatured,
        isFeatured: nextFeatured,
        is_featured: nextFeatured
      } : r));
      setStatusNotice(
        nextFeatured
          ? `Review by "${review.customerName || review.name}" featured on storefront.`
          : `Review by "${review.customerName || review.name}" unfeatured.`
      );
      setTimeout(() => setStatusNotice(''), 3000);
    } catch (err) {
      console.error('Failed to toggle review featured status:', err);
      alert('Failed to update review featured status');
    }
  };

  const handleToggleFeaturedReview = handleToggleApproveReview;

  const handleDeleteReview = async (id, reviewerName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the feedback by "${reviewerName}"?`)) {
      return;
    }
    try {
      if (api.deleteFeedback) {
        await api.deleteFeedback(id);
      } else {
        await api.deleteReview(id);
      }
      setReviews(prev => prev.filter(r => r.id !== id));
      setStatusNotice(`Feedback by "${reviewerName}" deleted successfully.`);
      setTimeout(() => setStatusNotice(''), 3000);
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const handleSaveNewReview = async (e) => {
    e.preventDefault();
    if (!newReviewForm.quote.trim() || !newReviewForm.name.trim()) {
      alert('Please fill in the reviewer name and review quote.');
      return;
    }

    try {
      const res = await api.addReview(newReviewForm);
      if (res && res.review) {
        setReviews(prev => [res.review, ...prev]);
        setNewReviewModal(false);
        setNewReviewForm({
          name: '',
          title: '',
          quote: '',
          item: '',
          rating: 5,
          verified: true,
          featured: true
        });
        setStatusNotice('New customer review published successfully!');
        setTimeout(() => setStatusNotice(''), 3000);
      }
    } catch (err) {
      alert('Failed to save review');
    }
  };

  // Save Supabase Config
  const handleSaveSupabaseConfig = (e) => {
    e.preventDefault();
    if (!supabaseUrlInput || !supabaseKeyInput) {
      alert('Please enter both Supabase URL and Anon/Public Key');
      return;
    }

    const saved = saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    if (saved) {
      setSupabaseConnected(true);
      setStatusNotice('✅ Supabase connected! Products and orders are now stored in your Supabase database.');
      setIsSupabaseModalOpen(false);
      loadDashboardData();
      if (onProductCreated) onProductCreated();
    }
  };

  const handleDisconnectSupabase = () => {
    saveSupabaseConfig('', '');
    setSupabaseConnected(false);
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setStatusNotice('Disconnected from Supabase. Reverted to local/REST engine.');
    setIsSupabaseModalOpen(false);
    loadDashboardData();
  };

  // Copy SQL script to clipboard
  const handleCopySql = () => {
    const sqlText = `-- SPEEDO FASHIONS SUPABASE SCHEMA
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Outerwear',
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image TEXT,
  badge TEXT DEFAULT 'New Arrival',
  tag TEXT DEFAULT '100% Cotton',
  sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
  stock INTEGER DEFAULT 15,
  "desc" TEXT,
  rating NUMERIC DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending',
  shipping_address TEXT,
  payment_method TEXT DEFAULT 'UPI',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Read on product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Public Upload to product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Image Upload Handlers
  const handleFileUpload = async (file, isEdit = false) => {
    if (!file) return;

    if (isEdit) setIsUploadingEditImg(true);
    else setIsUploadingAddImg(true);

    try {
      const result = await uploadImageToSupabase(file);
      if (result.success) {
        if (isEdit) {
          setEditFormData(prev => ({ ...prev, image: result.url }));
        } else {
          setNewProduct(prev => ({ ...prev, image: result.url }));
        }
        const notice = result.local
          ? 'Image loaded into product preview (Local mode).'
          : 'Image uploaded to Supabase Storage bucket (product-images)!';
        setStatusNotice(notice);
        setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      if (isEdit) setIsUploadingEditImg(false);
      else setIsUploadingAddImg(false);
    }
  };

  // Update Order Status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setStatusNotice(`Order ${orderId} updated to "${newStatus}"`);
      setTimeout(() => setStatusNotice(''), 3000);
      loadDashboardData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name || '',
      category: product.category || 'Outerwear',
      price: product.price || '',
      originalPrice: product.originalPrice || '',
      stock: product.stock !== undefined ? product.stock : 10,
      image: product.image || (Array.isArray(product.images) && product.images[0]) || '',
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
      badge: product.badge || '',
      tag: product.tag || '',
      desc: product.desc || ''
    });
  };

  // Submit Product Updates
  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsUpdatingProduct(true);

    try {
      await api.updateProduct(editingProduct.id, {
        name: editFormData.name,
        category: editFormData.category,
        price: parseFloat(editFormData.price),
        originalPrice: editFormData.originalPrice ? parseFloat(editFormData.originalPrice) : parseFloat(editFormData.price) * 1.25,
        stock: parseInt(editFormData.stock, 10),
        image: editFormData.image || (Array.isArray(editFormData.images) && editFormData.images[0]) || '',
        images: Array.isArray(editFormData.images) && editFormData.images.length > 0 ? editFormData.images : (editFormData.image ? [editFormData.image] : []),
        badge: editFormData.badge,
        tag: editFormData.tag,
        desc: editFormData.desc
      });

      setStatusNotice(`✅ Product "${editFormData.name}" updated successfully! Changes are live.`);
      setTimeout(() => setStatusNotice(''), 4000);
      setEditingProduct(null);
      if (onProductCreated) onProductCreated();
      loadDashboardData();
    } catch (err) {
      alert('Failed to update product: ' + err.message);
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  // Add Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const productPrice = newProduct.originalPrice || newProduct.price;
    if (!newProduct.name || !productPrice) {
      alert('Please fill out Product Name and Price');
      return;
    }

    try {
      const payload = {
        ...newProduct,
        price: parseFloat(productPrice),
        originalPrice: parseFloat(newProduct.originalPrice || productPrice)
      };
      const created = await api.addProduct(payload);
      setStatusNotice(`✅ Product "${created.name}" published! It is now live in the store.`);
      setTimeout(() => setStatusNotice(''), 4000);

      setNewProduct({
        name: '',
        category: 'Outerwear',
        price: '',
        originalPrice: '',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
        badge: 'New Arrival',
        tag: 'Premium Cotton',
        sizes: ['S', 'M', 'L', 'XL'],
        stock: 20,
        desc: ''
      });

      if (onProductCreated) onProductCreated();
      loadDashboardData();
      setActiveTab('inventory');
    } catch (err) {
      alert('Error adding product: ' + err.message);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}" (${id})? It will be permanently removed.`)) return;
    try {
      await api.deleteProduct(id);
      setStatusNotice(`Product "${name}" deleted from catalogue.`);
      setTimeout(() => setStatusNotice(''), 3000);
      loadDashboardData();
      if (onProductCreated) onProductCreated();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  // --- CATEGORY MANAGEMENT HANDLERS ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    // Check duplicate name (case-insensitive)
    const exists = categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setCategoryMsg({ type: 'error', text: `Category "${trimmed}" already exists.` });
      return;
    }

    setIsAddingCategory(true);
    setCategoryMsg({ type: '', text: '' });

    try {
      const added = await api.addCategory({ name: trimmed, description: newCatDesc.trim() });
      setNewCatName('');
      setNewCatDesc('');
      setCategoryMsg({ type: 'success', text: `Category "${added.name}" created and synced with Supabase!` });
      setTimeout(() => setCategoryMsg({ type: '', text: '' }), 4500);

      const refreshed = await api.getCategories();
      setCategories(refreshed);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setCategoryMsg({ type: 'error', text: err.message || 'Failed to add category' });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setCategoryMsg({ type: '', text: '' });
  };

  const handleSaveEditCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    const trimmed = editCatName.trim();
    if (!trimmed) return;

    // Check duplicate name with another category
    const isDup = categories.some(
      c => String(c.id) !== String(editingCategory.id) && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDup) {
      alert(`Another category named "${trimmed}" already exists.`);
      return;
    }

    setIsUpdatingCategory(true);
    try {
      await api.updateCategory(editingCategory.id, {
        name: trimmed,
        description: editCatDesc.trim()
      });

      setStatusNotice(`Category "${trimmed}" updated successfully in Supabase!`);
      setTimeout(() => setStatusNotice(''), 4000);

      setEditingCategory(null);
      const [refreshedCats, refreshedProds] = await Promise.all([
        api.getCategories(),
        api.getProducts()
      ]);
      setCategories(refreshedCats);
      setProducts(refreshedProds);
      if (onCategoriesChanged) onCategoriesChanged();
      if (onProductCreated) onProductCreated();
    } catch (err) {
      alert(err.message || 'Failed to update category');
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat, count) => {
    // Prevent deletion of categories assigned to products
    if (count > 0) {
      setCategoryMsg({
        type: 'error',
        text: `Cannot delete category "${cat.name}". It is currently assigned to ${count} product(s). Please reassign or delete those products first.`
      });
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}" from Supabase?`)) {
      return;
    }

    try {
      await api.deleteCategory(cat.id, cat.name);
      setStatusNotice(`Category "${cat.name}" deleted from Supabase.`);
      setTimeout(() => setStatusNotice(''), 4000);

      const refreshed = await api.getCategories();
      setCategories(refreshed);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      setCategoryMsg({ type: 'error', text: err.message || 'Failed to delete category' });
    }
  };

  // Filter products for inventory table
  const filteredInventory = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter orders for orders table
  const filteredOrders = orders.filter(o => {
    return o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.status && o.status.toLowerCase().includes(orderSearch.toLowerCase()));
  });



  // ==========================================
  // VIEW 2: MODERN SAAS CRM DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#1A1A1A] pb-24">

      {/* Modern Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between gap-4">

          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl overflow-hidden p-0.5 flex-shrink-0 shadow-sm">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-gray-900 tracking-tight">Speedo Admin</span>

                {/* Supabase Connection Status Pill */}
                <button
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border transition-colors cursor-pointer ${supabaseConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  title="Click to view/configure Supabase Database credentials"
                >
                  <Database className="w-3 h-3" />
                  <span>{supabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Logged in as <strong>admin@speedofashions.com</strong>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Database Config</span>
            </button>

            <button
              onClick={onNavigateToStore}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#FF6B6B]" />
              <span className="hidden sm:inline">View Store</span>
            </button>

            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FF6B6B]' : ''}`} />
            </button>

            <button
              onClick={handleLogoutClick}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Status Notification Banner */}
        {statusNotice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button onClick={() => setStatusNotice('')} className="text-emerald-500 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        <div className="bg-white rounded-xl p-2.5 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">

            {/* 1. Dashboard */}
            <button
              onClick={() => onSectionChange && onSectionChange('dashboard')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${currentSection === 'dashboard'
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <TrendingUp className="w-4 h-4 text-[#FF6B6B]" />
              <span>Dashboard</span>
            </button>

            {/* 2. Clothing Catalogue */}
            <button
              onClick={() => onSectionChange && onSectionChange('catlog')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${currentSection === 'catlog'
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Package className="w-4 h-4 text-[#A8D5BA]" />
              <span>Clothing Catalogue</span>
            </button>

            {/* 3. Customer Reviews */}
            <button
              onClick={() => onSectionChange && onSectionChange('reviews')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${currentSection === 'reviews'
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Star className="w-4 h-4 text-[#F0C987]" />
              <span>Customer Reviews</span>
            </button>

          </div>

          {/* Secure Admin Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ml-auto"
            title="Log out of Admin Portal"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Sub-Navigation for Clothing Catalogue */}
        {currentSection === 'catlog' && (
          <div className="bg-gray-100 rounded-xl p-1.5 border border-gray-200 flex flex-wrap gap-1.5 mb-6">
            <button
              onClick={() => setCatalogSubTab('inventory')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${catalogSubTab === 'inventory' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Package className="w-3.5 h-3.5 text-[#A8D5BA]" />
              <span>Inventory & Edit Items ({products.length})</span>
            </button>
            <button
              onClick={() => setCatalogSubTab('add-product')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${catalogSubTab === 'add-product' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#87CEEB]" />
              <span>Publish New Product</span>
            </button>
            <button
              onClick={() => setCatalogSubTab('categories')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${catalogSubTab === 'categories' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#F0C987]" />
              <span>Taxonomy & Categories ({categories.length})</span>
            </button>
          </div>
      )}

        {/* ========================================================= */}
        {currentSection === 'catlog' && catalogSubTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Header + Search & Filter Toolbar */}
            <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">
                  Clothing Inventory Management
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  View, edit details, adjust prices & stock, or delete items. Changes update Supabase in real-time.
                </p>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product or ID..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF6B6B] focus:bg-white w-48"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF6B6B]"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => setActiveTab('add-product')}
                  className="px-3.5 py-1.5 bg-[#FF6B6B] hover:bg-[#fa5555] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price (₹)</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Badge / Tag</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">
                        No products match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">

                        {/* Product Image & Name */}
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          <div>
                            <span className="font-bold text-gray-900 block text-sm">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ID: {p.id}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-medium text-[11px]">
                            {p.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-gray-900 text-sm">
                              ₹{p.price}
                            </span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[11px] text-gray-400 line-through">
                                ₹{p.originalPrice}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${(p.stock || 0) > 10
                              ? 'bg-emerald-50 text-emerald-700'
                              : (p.stock || 0) > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${(p.stock || 0) > 10 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}></span>
                            {p.stock !== undefined ? p.stock : 12} units
                          </span>
                        </td>

                        {/* Badge / Tag */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            {p.badge && (
                              <span className="text-[10px] font-semibold text-[#FF6B6B] bg-[#FF6B6B]/10 px-2 py-0.5 rounded w-max">
                                {p.badge}
                              </span>
                            )}
                            {p.tag && (
                              <span className="text-[10px] text-gray-500">
                                {p.tag}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions: EDIT & DELETE */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit item details, price & stock"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete from website"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {currentSection === 'dashboard' && (
          <div className="space-y-6">

            {/* ========================================================= */}
            {/* 4 ANALYTICS SUMMARY CARDS (AT THE TOP OF DASHBOARD) */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* CARD 1: TOTAL REVENUE (Delivered Orders Only, Excludes Cancelled) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                    TOTAL REVENUE
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Delivered Orders
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-gray-900">
                    ₹{calculatedRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="truncate">Earned from {deliveredOrdersCount} delivered orders</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* CARD 2: TOTAL ORDERS (All Statuses) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                    TOTAL ORDERS
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    All Stages
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-gray-900">
                    {totalOrdersCount}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">Bookings</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="truncate">Total customer orders placed</span>
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* CARD 3: DELIVERED ORDERS */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                    DELIVERED ORDERS
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Fulfilled
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-gray-900">
                    {deliveredOrdersCount}
                  </span>
                  <span className="text-xs text-emerald-600 font-mono font-semibold">
                    {totalOrdersCount > 0 ? `${Math.round((deliveredOrdersCount / totalOrdersCount) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="truncate">Successfully handed over to buyers</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* CARD 4: PENDING ORDERS */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                    PENDING ORDERS
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" /> Action Required
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-gray-900">
                    {pendingOrdersCount}
                  </span>
                  <span className="text-xs text-amber-600 font-mono font-semibold">In Pipeline</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="truncate">Orders awaiting cutting or transit</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </div>

            {/* CUSTOMER ORDERS TRACKER */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-gray-900">
                    Customer Orders Tracker
                  </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Real-time orders synced with database. Update status or view details.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by customer or Order ID..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF6B6B] focus:bg-white w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200">
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Items Ordered</th>
                    <th className="py-3 px-4">Total (₹)</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-gray-50/80 transition-colors">

                        {/* Order ID & Date */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="font-bold text-gray-900 block text-sm">
                            {ord.orderId}
                          </span>
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            {ord.date}
                          </span>
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1.5 inline-block">
                            {ord.paymentMethod}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="font-bold text-gray-900 block text-sm">
                            {ord.customerName}
                          </span>
                          <span className="text-gray-500 block text-[11px]">{ord.customerEmail}</span>
                          {ord.customerPhone && (
                            <span className="text-gray-400 block text-[11px]">{ord.customerPhone}</span>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-3.5 px-4 align-top">
                          <ul className="space-y-1">
                            {(ord.items || []).map((it, idx) => (
                              <li key={idx} className="flex justify-between gap-3 text-xs">
                                <span className="text-gray-800">
                                  <strong>{it.qty}x</strong> {it.name} <span className="text-gray-400">({it.size || 'M'})</span>
                                </span>
                                <span className="font-semibold text-gray-900">
                                  ₹{(it.price * it.qty).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {ord.notes && (
                            <p className="mt-2 text-[11px] bg-amber-50 border border-amber-200 rounded p-1 text-amber-800">
                              Note: {ord.notes}
                            </p>
                          )}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 align-top font-bold text-base text-gray-900">
                          ₹{ord.total}
                        </td>

                        {/* Destination */}
                        <td className="py-3.5 px-4 align-top text-gray-600 max-w-xs text-[11px]">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                            <span>{ord.shippingAddress}</span>
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-3.5 px-4 align-top">
                          <select
                            value={ord.status || 'Pending'}
                            onChange={(e) => handleStatusChange(ord.orderId, e.target.value)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border focus:outline-none cursor-pointer ${ord.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : ord.status === 'In Transit'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : ord.status === 'Cutting & Folding'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="Cutting & Folding">✂️ Cutting & Folding</option>
                            <option value="In Transit">🚚 In Transit</option>
                            <option value="Delivered">✅ Delivered</option>
                            <option value="Cancelled">❌ Cancelled</option>
                          </select>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

        {/* ========================================================= */}
        {currentSection === 'catlog' && catalogSubTab === 'add-product' && (
          <div className="max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h3 className="font-display font-bold text-xl text-gray-900">
                Publish New Product
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload image from computer or paste a URL. Saved items upload directly to Supabase and show live on the store!
              </p>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Asymmetric Faceted Trench Coat"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Outerwear">Outerwear</option>
                        <option value="Couture">Couture</option>
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Original Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value, price: e.target.value })}
                    placeholder="2499"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="15"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>
              </div>

              {/* Image Upload from Computer or URL */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <ProductImageUploader
                  images={newProduct.images || (newProduct.image ? [newProduct.image] : [])}
                  onChange={(updatedImages) => {
                    setNewProduct(prev => ({
                      ...prev,
                      images: updatedImages,
                      image: updatedImages[0] || ''
                    }));
                  }}
                  onUploadFile={uploadImageToSupabase}
                  isUploading={isUploadingAddImg}
                  label="Product Images (Upload Up to 5 Images)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Promotional Badge
                  </label>
                  <input
                    type="text"
                    value={newProduct.badge}
                    onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                    placeholder="e.g. Bestseller, Trending, New Arrival"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Fabric
                  </label>
                  <input
                    type="text"
                    value={newProduct.tag}
                    onChange={(e) => setNewProduct({ ...newProduct, tag: e.target.value })}
                    placeholder="e.g. 100% Washi Cotton, Tech-Silk"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Product Description
                </label>
                <textarea
                  rows="3"
                  value={newProduct.desc}
                  onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
                  placeholder="Describe fabric comfort, geometric fold patterns, and fit..."
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#FF6B6B] hover:bg-[#fa5555] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish Product to Main Website</span>
              </button>
            </form>
          </div>
      )}

        {/* ========================================================= */}
        {currentSection === 'catlog' && catalogSubTab === 'categories' && (
          <div className="space-y-6">

            {/* Top Card: Add Category Header & Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono font-bold tracking-wider mb-1.5 rounded">
                    <Layers className="w-3.5 h-3.5 text-[#FF6B6B]" />
                    TAXONOMY ARCHITECTURE
                  </div>
                  <h3 className="font-display font-bold text-xl text-gray-900">
                    Category Management
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xl">
                    Create, edit, and organize product categories. Categories automatically update storefront filter tabs, product addition dropdowns, and inventory analytics in Supabase.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-[#FAFAFA] border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-700">
                    {categories.length} Total Categories
                  </span>
                </div>
              </div>

              {/* Status / Error Alert */}
              {categoryMsg.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-xs font-medium ${categoryMsg.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">{categoryMsg.text}</div>
                  <button onClick={() => setCategoryMsg({ type: '', text: '' })} className="cursor-pointer text-gray-400 hover:text-gray-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ADD CATEGORY FORM */}
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        if (categoryMsg.text) setCategoryMsg({ type: '', text: '' });
                      }}
                      placeholder="e.g. Athleisure, Winterwear, Accessories"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="e.g. Laser-cut high-performance training garments"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="submit"
                      disabled={isAddingCategory || !newCatName.trim()}
                      className="w-full py-2.5 px-4 bg-[#1A1A1A] hover:bg-[#2e2e2e] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isAddingCategory ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#FF6B6B]" />
                      ) : (
                        <PlusCircle className="w-4 h-4 text-[#FF6B6B]" />
                      )}
                      <span>ADD</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Table Card: Categories Directory */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-base text-gray-900">
                    Existing Categories & Distribution
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Categories with assigned products are protected against accidental deletion.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const fresh = await api.getCategories();
                    setCategories(fresh);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg flex items-center gap-1.5 hover:bg-gray-50 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Assigned Products</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-gray-400 font-mono text-xs">
                          No categories defined yet. Use the form above to add your first category.
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat) => {
                        const count = products.filter(p => (p.category || '').toLowerCase() === cat.name.toLowerCase()).length;
                        return (
                          <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-gray-900">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#FF6B6B]"></span>
                                <span>{cat.name}</span>
                                {cat.slug && (
                                  <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                    /{cat.slug}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-gray-500 max-w-xs truncate">
                              {cat.description || <span className="text-gray-400 italic">No description</span>}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${count > 0
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                  : 'bg-gray-100 text-gray-600'
                                }`}>
                                <Package className="w-3.5 h-3.5" />
                                <span>{count} {count === 1 ? 'Product' : 'Products'}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditCategory(cat)}
                                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title={`Edit category ${cat.name}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat, count)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${count > 0
                                      ? 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                                      : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                  title={count > 0 ? `Assigned to ${count} product(s) - protected against deletion` : `Delete ${cat.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CUSTOMER REVIEWS MANAGEMENT */}
        {/* ========================================================= */}
        {currentSection === 'reviews' && (
          <div className="space-y-6">

            {/* Top Toolbar Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-mono font-bold tracking-wider mb-1.5 rounded border border-amber-200">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>CUSTOMER REVIEWS & QUALITY MODERATION</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-gray-900">
                    Customer Reviews Management
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Moderate customer reviews, verify authenticated purchases, approve feedback for the storefront, and highlight reviews on the homepage.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      const fresh = await api.getAdminReviews();
                      setReviews(fresh);
                      setIsLoading(false);
                    }}
                    className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                    title="Refresh reviews"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FF6B6B]' : ''}`} />
                  </button>
                  <button
                    onClick={() => setNewReviewModal(true)}
                    className="px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#2b2b2b] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-4 h-4 text-[#FF6B6B]" />
                    <span>Add Manual Review</span>
                  </button>
                </div>
              </div>

              {/* Reviews Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    Total Reviews
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-2xl text-gray-900">{reviews.length}</span>
                    <span className="text-xs text-gray-500 font-semibold">Submissions</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                    Approved & Live
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-2xl text-emerald-700">
                      {reviews.filter(r => r.isApproved).length}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold">On Storefront</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block mb-1">
                    Pending Approval
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-2xl text-amber-600">
                      {reviews.filter(r => !r.isApproved).length}
                    </span>
                    <span className="text-xs text-amber-600 font-semibold">Needs Review</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block mb-1">
                    Featured Highlights
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-2xl text-purple-700">
                      {reviews.filter(r => r.isFeatured).length}
                    </span>
                    <span className="text-xs text-purple-600 font-semibold">Homepage</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs for Customer Reviews */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  reviewFilter === 'all'
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Reviews ({reviews.length})
              </button>

              <button
                onClick={() => setReviewFilter('pending')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Approval ({reviews.filter(r => !r.isApproved).length})</span>
              </button>

              <button
                onClick={() => setReviewFilter('approved')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === 'approved'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approved ({reviews.filter(r => r.isApproved).length})</span>
              </button>

              <button
                onClick={() => setReviewFilter('featured')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  reviewFilter === 'featured'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Featured ({reviews.filter(r => r.isFeatured).length})</span>
              </button>
            </div>

            {/* Reviews Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.filter(r => {
                if (reviewFilter === 'approved') return r.isApproved;
                if (reviewFilter === 'pending') return !r.isApproved;
                if (reviewFilter === 'featured') return r.isFeatured;
                return true;
              }).length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 font-mono text-xs">
                  No review records found matching "${reviewFilter}".
                </div>
              ) : (
                reviews.filter(r => {
                  if (reviewFilter === 'approved') return r.isApproved;
                  if (reviewFilter === 'pending') return !r.isApproved;
                  if (reviewFilter === 'featured') return r.isFeatured;
                  return true;
                }).map((rev) => {
                  const isApproved = !!rev.isApproved;
                  const isFeatured = !!rev.isFeatured;
                  return (
                    <div
                      key={rev.id || rev.reviewId}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* Top Accent Strip */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                        isApproved
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-amber-400 to-[#FF6B6B]'
                      }`}></div>

                      <div>
                        {/* Review Card Header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            {/* Star Rating */}
                            <div className="flex items-center gap-1 text-amber-400 mb-1">
                              {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                              ))}
                              <span className="text-xs font-mono font-bold text-gray-600 ml-1">
                                {rev.rating || 5}.0
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-900">
                              {rev.customerName || rev.name}
                            </h4>
                            <p className="text-[11px] text-gray-500 font-mono">
                              ID: {rev.customerId || rev.customer_id || 'guest'}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono text-gray-400 block">
                              {rev.date || 'Recent'}
                            </span>
                            {rev.reviewId && (
                              <span className="text-[9px] font-mono text-gray-400 block mt-0.5">
                                #{rev.reviewId}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Garment / Product Name Badge */}
                        <div className="my-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 bg-gray-100 text-[#1A1A1A] border border-gray-200 rounded inline-block">
                            Garment: {rev.productName || rev.item || 'Speedo Couture'}
                          </span>
                        </div>

                        {/* Review Headline / Title */}
                        {(rev.reviewTitle || rev.title) && (
                          <h5 className="font-display font-bold text-xs text-gray-900 mt-2">
                            "{rev.reviewTitle || rev.title}"
                          </h5>
                        )}

                        {/* Complete Review Comment */}
                        <p className="text-xs text-gray-800 italic leading-relaxed my-2 bg-gray-50/80 p-3.5 rounded-lg border border-gray-100 whitespace-pre-line">
                          "{rev.comment || rev.quote}"
                        </p>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {isApproved ? (
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approved & Live on Storefront
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Quality Moderation (Hidden)
                            </span>
                          )}

                          {(rev.verifiedPurchase || rev.verified) ? (
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Verified Buyer
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                              Store Visitor
                            </span>
                          )}

                          {isFeatured && (
                            <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              ★ Featured on Home
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Moderation Actions Toolbar */}
                      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Approve / Reject Toggle Button */}
                          {isApproved ? (
                            <button
                              onClick={() => handleToggleApproveReview(rev)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-amber-50 text-gray-700 hover:text-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer border border-gray-200"
                              title="Revoke approval and hide review from storefront"
                            >
                              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                              <span>Revoke Approval</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleApproveReview(rev)}
                              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                              title="Approve and publish this review on the customer storefront"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve Review</span>
                            </button>
                          )}

                          {/* Feature / Unfeature Toggle Button */}
                          <button
                            onClick={() => handleToggleFeatureReview(rev)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border ${
                              isFeatured
                                ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                            title={isFeatured ? "Remove from homepage highlights" : "Feature on storefront homepage"}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFeatured ? 'text-purple-600 fill-purple-600' : 'text-gray-400'}`} />
                            <span>{isFeatured ? 'Featured' : 'Feature'}</span>
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteReview(rev.id || rev.reviewId, rev.customerName || rev.name)}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Permanently Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* EDIT CATEGORY MODAL */}
      {/* ========================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Edit3 className="w-4 h-4 text-[#FF6B6B]" />
                </div>
                <h4 className="font-display font-bold text-base text-gray-900">
                  Edit Category
                </h4>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Renaming this category will automatically update all existing products assigned to it in Supabase.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  placeholder="Short description for this collection taxonomy..."
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCategory || !editCatName.trim()}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2e2e2e] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingCategory ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#FF6B6B]" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUPABASE CLOUD DATABASE CONFIGURATION MODAL */}
      {/* ========================================================= */}
      {isSupabaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-gray-900">
                    Connect Supabase Real Database
                  </h3>
                  <p className="text-xs text-gray-500">
                    Store products, orders & customer details in your Supabase project.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSupabaseModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSupabaseConfig} className="p-6 space-y-4">

              {/* Connection Status Card */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${supabaseConnected
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  <div>
                    <p className="text-xs font-bold">
                      {supabaseConnected ? 'Supabase Project Active & Connected' : 'Supabase Not Configured'}
                    </p>
                    <p className="text-[11px] opacity-80">
                      {supabaseConnected
                        ? 'All catalog queries, orders & image uploads sync to your cloud database.'
                        : 'Currently using local storage / Node REST backend fallback.'}
                    </p>
                  </div>
                </div>

                {supabaseConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnectSupabase}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Supabase Project URL *
                </label>
                <input
                  type="url"
                  required
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Found in Supabase Dashboard ➔ Project Settings ➔ API ➔ Project URL
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Supabase Anon / Public Key *
                </label>
                <input
                  type="password"
                  required
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Found in Supabase Dashboard ➔ Project Settings ➔ API ➔ Project API keys (anon / public)
                </p>
              </div>

              {/* SQL Schema Copy Box */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800">
                    Database Tables & Storage SQL Schema
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                    <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Click <strong>Copy SQL Script</strong>, open your Supabase Dashboard ➔ <strong>SQL Editor</strong>, paste and run it to create the <code className="text-emerald-700">products</code>, <code className="text-emerald-700">orders</code> tables and <code className="text-emerald-700">product-images</code> storage bucket automatically!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>Save & Connect Supabase</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT PRODUCT MODAL */}
      {/* ========================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">
                  Edit Product Details
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update name, price, stock, or upload a new image. Saved changes update the database and store immediately.
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProductEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Outerwear">Outerwear</option>
                        <option value="Couture">Couture</option>
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Retail Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editFormData.originalPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, originalPrice: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Stock Units *
                  </label>
                  <input
                    type="number"
                    required
                    value={editFormData.stock}
                    onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>
              </div>

              {/* Image Upload or URL */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <ProductImageUploader
                  images={editFormData.images || (editFormData.image ? [editFormData.image] : [])}
                  onChange={(updatedImages) => {
                    setEditFormData(prev => ({
                      ...prev,
                      images: updatedImages,
                      image: updatedImages[0] || ''
                    }));
                  }}
                  onUploadFile={uploadImageToSupabase}
                  isUploading={isUploadingEditImg}
                  label="Product Images (Upload Up to 5 Images)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={editFormData.badge}
                    onChange={(e) => setEditFormData({ ...editFormData, badge: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Tag / Material
                  </label>
                  <input
                    type="text"
                    value={editFormData.tag}
                    onChange={(e) => setEditFormData({ ...editFormData, tag: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={editFormData.desc}
                  onChange={(e) => setEditFormData({ ...editFormData, desc: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                ></textarea>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdatingProduct}
                  className="px-6 py-2.5 bg-[#FF6B6B] hover:bg-[#fa5555] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isUpdatingProduct ? 'Saving to Database...' : 'Save & Update Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD CUSTOMER REVIEW MODAL */}
      {/* ========================================================= */}
      {newReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg p-6 sm:p-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-display font-bold text-lg text-gray-900">
                  Publish New Customer Review
                </h3>
              </div>
              <button
                onClick={() => setNewReviewModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Tanaka"
                    value={newReviewForm.name}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Title / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Architect, Kyoto"
                    value={newReviewForm.title}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Product *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Origami Polyhedron Parka"
                    value={newReviewForm.item}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, item: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Rating (Stars)
                  </label>
                  <select
                    value={newReviewForm.rating}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, rating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white font-bold text-amber-600 cursor-pointer"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Customer Testimonial Quote *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Share the customer's feedback on fabric, crease, ergonomics, or styling..."
                  value={newReviewForm.quote}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, quote: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-white"
                ></textarea>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={newReviewForm.verified}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, verified: e.target.checked })}
                    className="w-4 h-4 text-[#FF6B6B] rounded border-gray-300"
                  />
                  <span>Mark as Verified Buyer</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={newReviewForm.featured}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, featured: e.target.checked })}
                    className="w-4 h-4 text-[#FF6B6B] rounded border-gray-300"
                  />
                  <span>Feature on Storefront</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewReviewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#2b2b2b] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
                >
                  Publish Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
