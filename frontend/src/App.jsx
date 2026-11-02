import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StorePage from './pages/StorePage';
import RouteAdmin from './pages/RouteAdmin';
import AdminLoginPage from './pages/AdminLoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import CustomerModal from './components/CustomerModal';
import AuthGatePage from './pages/AuthGatePage';
import AnimatedLogoIntro from './components/AnimatedLogoIntro';
import { api } from './services/api';

export default function App() {
  // Routing view: 'store' | 'admin' | 'admin-login'
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window === 'undefined') return 'store';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('/speedo-control/login') || hash.includes('speedo-control/login') || path.includes('/routeadmin') || hash.includes('routeadmin')) {
      return 'admin-login';
    }
    if (path.includes('/speedo-control') || hash.includes('speedo-control')) {
      return 'admin';
    }
    return 'store';
  });

  // Cinematic Logo Intro State (Plays at the very beginning on every page reload/visit)
  const [isIntroComplete, setIsIntroComplete] = useState(false);

  // Admin Portal State
  const [adminUser, setAdminUser] = useState(null);
  const [adminSection, setAdminSection] = useState('dashboard'); // 'dashboard' | 'catlog' | 'reviews'
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  // Global Products & Categories State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Cart State (Persisted in LocalStorage)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('speedo_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Customer Account State (Persisted in LocalStorage)
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('speedo_customer');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // UI Drawer / Modal States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Sync latest customer profile and address from backend if customer exists
  useEffect(() => {
    if (!customer?.phone) return;
    const cleanPhone = String(customer.phone).replace(/\D/g, '').slice(-10);
    api.getCustomerProfile(cleanPhone)
      .then((custRecord) => {
        if (custRecord) {
          setCustomer(custRecord);
          localStorage.setItem('speedo_customer', JSON.stringify(custRecord));
        }
      })
      .catch((err) => console.warn('Customer profile sync warning:', err));
  }, []);

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('speedo_cart_items', JSON.stringify(cart));
  }, [cart]);

  // Fetch Products & Categories from Backend / Supabase
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Route Resolver & Route Protection Gate
  const resolveCurrentRoute = async () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // 1. Detect and Redirect Old Admin URLs (/routeadmin, /routeadmin/login, #routeadmin)
    if (path.includes('/routeadmin') || hash.includes('routeadmin')) {
      if (window.history.replaceState) {
        window.history.replaceState(null, '', '/speedo-control/login');
      }
      setCurrentView('admin-login');
      return;
    }

    // 2. Explicit Admin Login Page (/speedo-control/login)
    const isLoginRoute = path === '/speedo-control/login' || path.startsWith('/speedo-control/login') || hash.includes('speedo-control/login');
    if (isLoginRoute) {
      // Clean any accidental hash
      if (window.location.hash && window.history.replaceState) {
        window.history.replaceState(null, '', '/speedo-control/login');
      }
      setCurrentView('admin-login');
      return;
    }

    // 3. Protected Admin Route (/speedo-control)
    const isSpeedoControlRoute = path === '/speedo-control' || path.startsWith('/speedo-control') || hash.includes('speedo-control');
    if (isSpeedoControlRoute) {
      // Remove any unwanted hash fragment (e.g. #speedo-control) cleanly from the address bar
      if (window.location.hash && window.history.replaceState) {
        window.history.replaceState(null, '', '/speedo-control');
      }

      setIsVerifyingAdmin(true);
      const user = await api.checkAdminAuth();
      setIsVerifyingAdmin(false);

      if (user) {
        setAdminUser(user);
        setCurrentView('admin');
      } else {
        // Unauthorized -> Redirect immediately to /speedo-control/login
        if (window.history.replaceState) {
          window.history.replaceState(null, '', '/speedo-control/login');
        }
        setCurrentView('admin-login');
      }
      return;
    }

    // 4. Normal Storefront View
    setCurrentView('store');
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    resolveCurrentRoute();

    const handleRouteChange = () => {
      resolveCurrentRoute();
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Admin Authentication Actions
  const handleAdminLoginSuccess = (user) => {
    setAdminUser(user);
    setCurrentView('admin');
    setAdminSection('dashboard');
    // Clean redirect without appending any hash
    if (window.history.pushState) {
      window.history.pushState(null, '', '/speedo-control');
    } else if (window.history.replaceState) {
      window.history.replaceState(null, '', '/speedo-control');
    }
  };

  const handleAdminLogout = async () => {
    await api.adminLogout();
    setAdminUser(null);
    setCurrentView('admin-login');
    // Prevent browser back navigation from reopening protected admin views
    if (window.history.replaceState) {
      window.history.replaceState(null, '', '/speedo-control/login');
    }
  };

  // Internal React State Navigation for Admin Subpages:
  // Switches between 'dashboard', 'catlog', and 'reviews' WITHOUT modifying the browser URL!
  const handleAdminSectionChange = (section) => {
    setAdminSection(section);
  };

  // Storefront Navigation Handler
  const handleNavigate = (view) => {
    if (view === 'store') {
      setCurrentView('store');
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Customer Account Logout Handler
  const handleCustomerLogout = () => {
    setCustomer(null);
    localStorage.removeItem('speedo_customer');
    setIsCustomerModalOpen(false);
  };

  // Cart Handlers with Size-Stock Verification
  const handleAddToCart = (product, size, qty = 1) => {
    const chosenSize = size || (product.sizes ? product.sizes[0] : 'M');
    const rawStock = product.size_stock || product.sizeStock || {};
    const availableForSize = rawStock[chosenSize] !== undefined ? Number(rawStock[chosenSize]) : (product.stock || 10);
    
    // Prevent adding if size is out of stock
    if (availableForSize <= 0) return;

    const addQty = Math.min(availableForSize, Math.max(1, parseInt(qty, 10) || 1));
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.size === chosenSize
      );
      if (existingIndex > -1) {
        const nextQty = Math.min(availableForSize, prevCart[existingIndex].qty + addQty);
        return prevCart.map((item, idx) =>
          idx === existingIndex ? { ...item, qty: nextQty } : item
        );
      }
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          size: chosenSize,
          category: product.category,
          qty: addQty
        }
      ];
    });
  };

  const handleUpdateQty = (index, delta) => {
    setCart((prevCart) => {
      if (!prevCart[index]) return prevCart;
      const item = prevCart[index];
      const prod = products.find(p => p.id === item.id);
      const rawStock = prod?.size_stock || prod?.sizeStock || {};
      const availableForSize = rawStock[item.size] !== undefined ? Number(rawStock[item.size]) : (prod?.stock || 10);

      const targetQty = item.qty + delta;
      if (targetQty <= 0) {
        return prevCart.filter((_, idx) => idx !== index);
      }
      // Cap at size-wise available stock
      if (delta > 0 && targetQty > availableForSize) {
        return prevCart;
      }
      return prevCart.map((it, idx) =>
        idx === index ? { ...it, qty: targetQty } : it
      );
    });
  };

  const handleRemoveItem = (index) => {
    setCart((prevCart) => prevCart.filter((_, idx) => idx !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // 1. RENDER ADMIN LOGIN PAGE (/speedo-control/login)
  if (currentView === 'admin-login') {
    return <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} />;
  }

  // 2. RENDER PROTECTED ADMIN CONSOLE (/speedo-control)
  if (currentView === 'admin') {
    if (isVerifyingAdmin) {
      return (
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-white font-mono text-sm">
          <span>Verifying administrator credentials...</span>
        </div>
      );
    }
    return (
      <ErrorBoundary>
        <RouteAdmin
          adminUser={adminUser}
          onLogout={handleAdminLogout}
          onNavigateToStore={() => {
            if (window.history.pushState) {
              window.history.pushState(null, '', '/');
            } else if (window.history.replaceState) {
              window.history.replaceState(null, '', '/');
            }
            setCurrentView('store');
          }}
          onProductCreated={fetchProducts}
          onCategoriesChanged={fetchCategories}
          categories={categories}
          activeSection={adminSection}
          onSectionChange={handleAdminSectionChange}
        />
      </ErrorBoundary>
    );
  }

  // 3. RENDER CUSTOMER AUTH GATE (If customer not registered / logged in)
  if (currentView === 'store' && !customer) {
    return (
      <>
        {/* Cinematic Logo Intro Animation (Plays at the very beginning before login/register) */}
        {!isIntroComplete && (
          <AnimatedLogoIntro onComplete={() => setIsIntroComplete(true)} />
        )}
        <AuthGatePage
          onAuthenticated={(authedCust) => {
            setCustomer(authedCust);
          }}
        />
      </>
    );
  }

  // 4. RENDER CUSTOMER STOREFRONT (After successful login or if already logged in)
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#1A1A1A]">
      {/* Cinematic Logo Intro Animation (Plays at the very beginning before homepage) */}
      {!isIntroComplete && (
        <AnimatedLogoIntro onComplete={() => setIsIntroComplete(true)} />
      )}

      {/* Header Navbar */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        currentView={currentView}
        customer={customer}
        onOpenAccount={() => setIsCustomerModalOpen(true)}
      />

      {/* Main View: Storefront */}
      <main className="flex-grow">
        <StorePage
          products={products}
          categories={categories}
          cart={cart}
          customer={customer}
          onOpenAccount={() => setIsCustomerModalOpen(true)}
          onAddToCart={handleAddToCart}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onRefreshProducts={() => {
            fetchProducts();
            fetchCategories();
          }}
          isLoadingProducts={isLoadingProducts}
        />
      </main>

      {/* Footer */}
      <Footer
        onNavigateToStore={() => handleNavigate('store')}
      />

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveItem}
        onProceedCheckout={handleProceedCheckout}
      />

      {/* Modern Checkout Section Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        customer={customer}
        onOpenAccount={() => setIsCustomerModalOpen(true)}
        onUpdateCustomer={(updated) => setCustomer(updated)}
        onOrderSuccess={() => {
          handleClearCart();
          fetchProducts();
        }}
      />

      {/* Customer Account & Saved Address Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={customer}
        onLoginSuccess={(loggedCust) => setCustomer(loggedCust)}
        onLogout={handleCustomerLogout}
        onAddressUpdated={(updatedCust) => setCustomer(updatedCust)}
      />
    </div>
  );
}
