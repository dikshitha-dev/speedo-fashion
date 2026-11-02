import React, { useState } from 'react';
import { ShoppingBag, Menu, X, ArrowUpRight, User } from 'lucide-react';

export default function Navbar({ cartCount, onOpenCart, onNavigate, currentView, customer, onOpenAccount }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId) => {
    if (currentView !== 'store') {
      onNavigate('store');
    }
    setMobileMenuOpen(false);
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
      {/* Top Announcement Bar */}
      <div className="bg-[#111111] text-white py-1.5 px-4 text-[11px] sm:text-xs font-mono font-bold tracking-widest text-center overflow-hidden">
        <span>FREE SHIPPING ON ORDERS ABOVE ₹1,499</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => handleNavClick()} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <img 
            src="/logo.jpg" 
            alt="Speedo Fashions Logo" 
            className="h-10 sm:h-12 w-auto object-contain rounded-lg bg-black p-1 shadow-sm transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to text if image fails
              e.currentTarget.style.display = 'none';
            }} 
          />
          <div>
            <span className="font-display font-black text-sm sm:text-xl tracking-tight sm:tracking-tighter text-[#111111] group-hover:text-[#E53935] transition-colors block leading-none">
              SPEEDO <span className="text-[#E53935]">FASHIONS</span>
            </span>
            <p className="text-[7px] sm:text-[9px] uppercase tracking-widest text-gray-500 font-semibold mt-0.5 sm:-mt-1 whitespace-nowrap">
              BEYOND FASHION, BEYOND LIMITS
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links: HOME, COLLECTIONS, REVIEWS, CONTACT */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-xs sm:text-sm font-bold tracking-wider uppercase select-none">
          <button 
            onClick={() => handleNavClick()}
            className={`transition-colors cursor-pointer pb-1 border-b-2 ${
              currentView === 'store' 
                ? 'text-[#E53935] border-[#E53935]' 
                : 'text-gray-700 hover:text-[#E53935] border-transparent'
            }`}
          >
            HOME
          </button>

          <button 
            onClick={() => handleNavClick('catalog')}
            className="text-gray-700 hover:text-[#E53935] transition-colors cursor-pointer pb-1 border-b-2 border-transparent"
          >
            COLLECTIONS
          </button>

          <button 
            onClick={() => handleNavClick('reviews')}
            className="text-gray-700 hover:text-[#E53935] transition-colors cursor-pointer pb-1 border-b-2 border-transparent"
          >
            REVIEWS
          </button>

          <button 
            onClick={() => handleNavClick('contact')}
            className="text-gray-700 hover:text-[#E53935] transition-colors cursor-pointer pb-1 border-b-2 border-transparent"
          >
            CONTACT
          </button>
        </nav>

        {/* Actions: Profile/User Icon, Divider, Cart, Shop Now Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Customer Profile / Account Button */}
          <button 
            onClick={onOpenAccount}
            className="p-2 text-gray-800 hover:text-[#E53935] transition-colors cursor-pointer flex items-center gap-1.5 relative group"
            title={customer ? `Account (+91 ${customer.phone})` : "Customer Sign In"}
            aria-label="Customer Profile Account"
          >
            <User className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider text-gray-700 group-hover:text-[#E53935]">
              {customer ? (customer.name ? customer.name.split(' ')[0] : 'Profile') : 'Profile'}
            </span>
            {customer && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1 animate-pulse"></span>
            )}
          </button>

          {/* Vertical Divider */}
          <span className="h-5 w-px bg-gray-300"></span>

          {/* Cart Drawer Trigger */}
          <button 
            onClick={onOpenCart}
            className="relative p-2 text-gray-800 hover:text-[#E53935] transition-colors cursor-pointer group"
            title="Open Shopping Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#E53935] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Red Shop Now Button */}
          <button 
            onClick={() => handleNavClick('catalog')}
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded shadow-sm hover:shadow transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>SHOP NOW</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-800 hover:text-[#E53935] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu: Profile, HOME, COLLECTIONS, CONTACT */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex flex-col gap-2 shadow-lg animate-fadeIn">
          {/* Profile / Account link */}
          <button 
            onClick={() => { onOpenAccount(); setMobileMenuOpen(false); }}
            className="text-left py-2.5 font-bold text-sm text-[#E53935] border-b border-gray-100 flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>{customer ? `Hi, ${customer.name} (My Profile)` : 'Sign In / Register Profile'}</span>
          </button>

          {/* 1. HOME */}
          <button 
            onClick={() => handleNavClick()}
            className={`text-left py-2 font-bold text-sm border-b border-gray-100 ${
              currentView === 'store' ? 'text-[#E53935]' : 'text-gray-800 hover:text-[#E53935]'
            }`}
          >
            HOME
          </button>

          {/* 2. COLLECTIONS */}
          <button 
            onClick={() => handleNavClick('catalog')}
            className="text-left py-2 font-bold text-sm text-gray-800 hover:text-[#E53935] border-b border-gray-100"
          >
            COLLECTIONS
          </button>

          {/* 3. REVIEWS */}
          <button 
            onClick={() => handleNavClick('reviews')}
            className="text-left py-2 font-bold text-sm text-gray-800 hover:text-[#E53935] border-b border-gray-100"
          >
            REVIEWS
          </button>

          {/* 4. CONTACT */}
          <button 
            onClick={() => handleNavClick('contact')}
            className="text-left py-2 font-bold text-sm text-gray-800 hover:text-[#E53935] border-b border-gray-100"
          >
            CONTACT
          </button>
        </div>
      )}
    </header>
  );
}
