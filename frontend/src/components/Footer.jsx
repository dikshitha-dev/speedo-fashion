import React from 'react';
import { ArrowUp, Instagram, Phone, Mail } from 'lucide-react';

export default function Footer({ onNavigateToAdmin, onNavigateToStore }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="bg-[#1A1A1A] text-white pt-16 pb-12 border-t-4 border-[#FF6B6B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-gray-800">

          {/* Brand Info (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black overflow-hidden border border-white/40 shadow-sm">
                <img
                  src="/logo.jpg"
                  alt="Speedo Fashions Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <span className="font-display font-black text-2xl tracking-tighter text-white">
                SPEEDO <span className="text-[#FF6B6B]">FASHIONS</span>
              </span>
            </div>

            {/* Brand Description */}
            <div className="text-xs text-gray-400 font-normal leading-relaxed max-w-sm space-y-2">
              <p className="font-semibold text-white text-sm">
                Style That Moves With You.
              </p>
              <p>
                Discover modern men's fashion designed for confidence, comfort, and everyday style. From casual essentials to statement pieces, Speedo Fashions brings you the latest trends with quality you can trust.
              </p>
            </div>

            {/* Contact Information */}
            <div className="pt-2">
              <a
                href="tel:+919063335165"
                className="inline-flex items-center gap-2 text-xs font-mono text-gray-300 hover:text-[#FF6B6B] transition-colors"
                title="Call Speedo Fashions Support"
              >
                <Phone className="w-4 h-4 text-[#FF6B6B]" />
                <span className="font-semibold">Phone: +91 90633 35165</span>
              </a>
            </div>

            {/* Official Instagram Link */}
            <div className="pt-2 flex items-center gap-3 text-gray-400">
              <a
                href="https://www.instagram.com/speedoo_fashion/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-gray-700 hover:border-[#FF6B6B] hover:text-[#FF6B6B] transition-colors flex items-center gap-2 text-xs font-mono"
                title="Follow Speedo Fashions on Instagram"
                aria-label="Follow Speedo Fashions on Instagram"
              >
                <Instagram className="w-4 h-4" />
                <span className="text-[11px] font-mono">@speedoo_fashion</span>
              </a>
            </div>
          </div>

          {/* Col 1: Collections */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#FF6B6B]"></span>
              Collections
            </h4>
            <ul className="space-y-2 text-xs font-mono text-gray-400">
              <li><a href="#catalog" className="hover:text-white transition-colors">Jackets & Outerwear</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Shirts & Polos</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">T-Shirts & Hoodies</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Cargo Pants & Bottoms</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">New Arrivals</a></li>
            </ul>
          </div>

          {/* Col 2: Brand Information */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#87CEEB]"></span>
              Brand Information
            </h4>
            <ul className="space-y-2 text-xs font-mono text-gray-400">
              <li><a href="#reviews" className="hover:text-white transition-colors">Customer Reviews</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Premium Fabric Quality</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Sustainable Craftsmanship</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Men's Style Trends</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Size & Fit Guide</a></li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Legal */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#A8D5BA]"></span>
              Customer Care & Legal
            </h4>
            <ul className="space-y-2 text-xs font-mono text-gray-400">
              <li>
                <a href="tel:+919063335165" className="hover:text-[#FF6B6B] transition-colors flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#FF6B6B]" />
                  <span>Call: +91 90633 35165</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:midhekarthik04@gmail.com"
                  className="hover:text-[#FF6B6B] transition-colors flex items-center gap-1.5 break-all"
                  title="Send email to Speedo Fashions"
                >
                  <Mail className="w-3.5 h-3.5 text-[#FF6B6B] shrink-0" />
                  <span>Email: midhekarthik04@gmail.com</span>
                </a>
              </li>
              <li><a href="#catalog" className="hover:text-white transition-colors">All India Express Delivery</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Returns & Exchange Policy</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Privacy & Data Policy</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright 2026 */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-gray-400 gap-4">
          <p>© 2026 SPEEDO FASHIONS. All Rights Reserved. Modern Men's Fashion.</p>

          <div className="flex items-center gap-4">
            <span className="text-[#FF6B6B] font-semibold">STYLE • COMFORT • CONFIDENCE</span>
            <button
              onClick={scrollToTop}
              className="p-2 border border-gray-700 hover:border-white text-white transition-colors flex items-center gap-1 cursor-pointer"
              title="Return to top"
              aria-label="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
