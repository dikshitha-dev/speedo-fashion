import React, { useState, useEffect } from 'react';
import { 
  X, ShoppingBag, Star, CheckCircle, Shield, AlertCircle, 
  ChevronLeft, ChevronRight, MessageSquare, ArrowLeft, Ruler, 
  RotateCcw, Sparkles 
} from 'lucide-react';

export default function ProductModal({ product, isOpen, onClose, onAddToCart, onWriteReview }) {
  const isVisible = Boolean(isOpen && product);
  const activeProduct = product || {};

  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Touch Swipe Gesture State for Mobile Image Carousel
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  // Ref to track and preserve the exact mobile scroll position
  const savedScrollY = React.useRef(0);

  // Normalize multi-images array (up to 5 images)
  const imagesList = React.useMemo(() => {
    if (Array.isArray(activeProduct.images) && activeProduct.images.length > 0) {
      return activeProduct.images.filter(Boolean);
    }
    if (activeProduct.image) {
      return [activeProduct.image];
    }
    return ['https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80'];
  }, [activeProduct.images, activeProduct.image]);

  // Reset product state when a new product is selected
  useEffect(() => {
    if (product) {
      setSelectedSize('');
      setQty(1);
      setSizeError(false);
      setAddedNotice(false);
      setActiveImgIndex(0);
      setIsSizeGuideOpen(false);
    }
  }, [product]);

  // Handle body scroll lock & restore scroll position on return
  useEffect(() => {
    if (!isVisible) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile) {
      // 1. Capture current scroll position before locking
      const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      savedScrollY.current = currentScrollY;

      // 2. Save previous styles
      const prevBodyOverflow = document.body.style.overflow;
      const prevBodyPosition = document.body.style.position;
      const prevBodyTop = document.body.style.top;
      const prevBodyWidth = document.body.style.width;

      // 3. Lock background on mobile to prevent background scroll drift
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // 4. Release all locks on mobile
        document.body.style.overflow = prevBodyOverflow || '';
        document.body.style.position = prevBodyPosition || '';
        document.body.style.top = prevBodyTop || '';
        document.body.style.width = prevBodyWidth || '';
        document.documentElement.style.overflow = '';

        // 5. Restore previous scroll position immediately & in next animation frame
        window.scrollTo({
          top: currentScrollY,
          left: 0,
          behavior: 'instant'
        });
        requestAnimationFrame(() => {
          window.scrollTo(0, currentScrollY);
        });
      };
    } else {
      // Desktop: preserve existing desktop modal behavior exactly
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || '';
      };
    }
  }, [isVisible]);

  // Safety cleanup: ensure body scroll is always restored if component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Listen to Escape key on desktop
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  const handlePrevImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImgIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImgIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => {
    if (!e.targetTouches || e.targetTouches.length === 0) return;
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e) => {
    if (!e.targetTouches || e.targetTouches.length === 0) return;
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;
    if (isLeftSwipe) {
      setActiveImgIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      setActiveImgIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const rawStockObj = product?.size_stock || product?.sizeStock || {};
  const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const displaySizes = Array.isArray(product?.sizes) && product.sizes.length > 0
    ? Array.from(new Set([...product.sizes, ...standardSizes.filter(sz => (rawStockObj[sz] || 0) > 0)]))
    : standardSizes;

  const isAllSoldOut = (product?.stock <= 0) || (Object.keys(rawStockObj).length > 0 && Object.values(rawStockObj).every(q => Number(q) <= 0));
  const selectedSizeStock = selectedSize ? (rawStockObj[selectedSize] !== undefined ? Number(rawStockObj[selectedSize]) : (product?.stock || 0)) : 0;
  const maxAvailableQty = selectedSize ? Math.max(1, selectedSizeStock) : 10;

  const handleAdd = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    const availableForSize = rawStockObj[selectedSize] !== undefined ? Number(rawStockObj[selectedSize]) : (product?.stock || 0);
    if (availableForSize <= 0) {
      setSizeError(true);
      return;
    }

    const finalQty = Math.min(qty, availableForSize);
    onAddToCart(product, selectedSize, finalQty);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 900);
  };

  const discountPercent = product?.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Unconditionally evaluate hooks; return null only if not visible
  if (!isVisible) return null;

  return (
    <>
      {/* =======================================================================
          MOBILE FULL-SCREEN PRODUCT PAGE (Visible ONLY on mobile: md:hidden)
          ======================================================================= */}
      <div className="md:hidden fixed inset-0 z-50 bg-[#FAFAFA] flex flex-col w-full h-full overflow-hidden animate-fadeIn">
        
        {/* Sticky Mobile Top Header with Back Button */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="p-1 -ml-1 text-gray-800 hover:text-[#E53935] flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider cursor-pointer"
            aria-label="Back to Products"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold truncate max-w-[150px]">
              {product.category || 'Speedo Fashion'}
            </span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-black cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Mobile Body */}
        <main 
          className="flex-1 overflow-y-auto overscroll-contain pb-28"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          
          {/* 1. Large Swipeable Product Image at the Top */}
          <section 
            className="relative w-full aspect-[3/4] bg-white flex items-center justify-center overflow-hidden border-b border-gray-200 select-none touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={imagesList[activeImgIndex] || imagesList[0]} 
              alt={`${product.name} - view ${activeImgIndex + 1}`}
              className="w-full h-full object-contain object-center transition-all duration-300 p-2"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80';
              }}
            />

            {/* Left & Right Chevrons */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-gray-800 shadow-md flex items-center justify-center cursor-pointer active:scale-95 z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-gray-800 shadow-md flex items-center justify-center cursor-pointer active:scale-95 z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image Counter Badge */}
            {imagesList.length > 1 && (
              <div className="absolute top-3 right-3 bg-[#1A1A1A]/80 backdrop-blur-sm text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-sm z-10">
                {activeImgIndex + 1} / {imagesList.length}
              </div>
            )}

            {/* Product Badge (Mobile - Clean, compact, branded origami styling) */}
            {product.badge && (
              <div className="absolute top-3 left-3 bg-[#1A1A1A] text-white text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 shadow-sm clip-origami-badge z-10 max-w-[55%] truncate">
                {product.badge}
              </div>
            )}

            {/* Carousel Dots Indicator */}
            {imagesList.length > 1 && (
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10">
                {imagesList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    className={`transition-all rounded-full ${
                      activeImgIndex === idx 
                        ? 'w-5 h-1.5 bg-[#E53935]' 
                        : 'w-1.5 h-1.5 bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Thumbnails Row (if > 1 image) */}
          {imagesList.length > 1 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100 overflow-x-auto">
              {imagesList.map((thumbUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImgIndex(idx)}
                  className={`w-12 h-14 bg-white border rounded overflow-hidden shrink-0 p-0.5 transition-all cursor-pointer ${
                    activeImgIndex === idx
                      ? 'border-[#E53935] ring-2 ring-[#E53935]/30'
                      : 'border-gray-200 opacity-60'
                  }`}
                >
                  <img src={thumbUrl} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* 2. Product Details & Price */}
          <div className="p-4 bg-white border-b border-gray-200">
            {/* Category, Fabric Tag & Rating */}
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-[#E53935] uppercase tracking-wider text-[11px]">
                  {product.category}
                </span>
                {product.tag && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[#2A2A2A] bg-gray-100 border border-gray-200 px-2 py-0.5">
                      <span className="w-1 h-1 rounded-full bg-[#E53935]" />
                      {product.tag}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded shrink-0">
                <Star className="w-3.5 h-3.5 fill-[#E53935] text-[#E53935]" />
                <span className="font-bold text-xs text-[#111111]">{product.rating || '4.9'}</span>
                <span className="text-gray-400 text-[10px]">({product.reviewsCount || 42})</span>
              </div>
            </div>

            {/* Product Name */}
            <h1 className="text-xl font-display font-black text-[#111111] leading-snug mb-2">
              {product.name}
            </h1>

            {/* Price Row */}
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-display font-black text-[#111111]">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-sm font-mono text-gray-400 line-through">
                    ₹{product.originalPrice}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#E53935]/10 text-[#E53935] rounded">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-500 font-sans mt-1">Inclusive of all taxes</p>
          </div>

          {/* 3. Sizes & Size Guide */}
          <div className="p-4 bg-white border-b border-gray-200 mt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#111111] flex items-center gap-1.5">
                <span>SELECT SIZE</span>
                {selectedSize ? (
                  <span className="text-emerald-600 font-black">({selectedSize} SELECTED)</span>
                ) : (
                  <span className="text-[#E53935] text-[11px] font-bold">* Required</span>
                )}
              </span>

              {/* Size Guide Toggle Button */}
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(!isSizeGuideOpen)}
                className="text-xs font-bold text-[#E53935] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>{isSizeGuideOpen ? 'Hide Size Guide' : 'Size Guide'}</span>
              </button>
            </div>

            {/* Interactive Size Guide Table */}
            {isSizeGuideOpen && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs animate-fadeIn">
                <p className="font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-[#E53935]" /> Standard Men's Sizing (Inches)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-gray-300 text-gray-600">
                        <th className="py-1">Size</th>
                        <th className="py-1">Chest</th>
                        <th className="py-1">Length</th>
                        <th className="py-1">Shoulder</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      <tr><td className="py-1 font-bold">S</td><td>38"</td><td>27"</td><td>17"</td></tr>
                      <tr><td className="py-1 font-bold">M</td><td>40"</td><td>28"</td><td>18"</td></tr>
                      <tr><td className="py-1 font-bold">L</td><td>42"</td><td>29"</td><td>19"</td></tr>
                      <tr><td className="py-1 font-bold">XL</td><td>44"</td><td>30"</td><td>20"</td></tr>
                      <tr><td className="py-1 font-bold">XXL</td><td>46"</td><td>31"</td><td>21"</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Size Selector Pills with Size-Wise Stock Display */}
            <div className="flex flex-wrap gap-2.5">
              {displaySizes.map((size) => {
                const stockQty = rawStockObj[size] !== undefined ? Number(rawStockObj[size]) : (product.sizes?.includes(size) ? (product.stock || 0) : 0);
                const isSoldOut = stockQty <= 0;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => {
                      if (isSoldOut) return;
                      setSelectedSize(size);
                      setSizeError(false);
                      if (qty > stockQty) setQty(Math.max(1, stockQty));
                    }}
                    className={`h-12 min-w-[56px] px-3 py-1 text-xs font-mono font-bold rounded border transition-all flex flex-col items-center justify-center relative ${
                      isSoldOut
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50 line-through'
                        : selectedSize === size
                          ? 'bg-[#111111] text-white border-[#111111] ring-2 ring-[#E53935] shadow-sm cursor-pointer'
                          : sizeError
                            ? 'bg-white text-gray-800 border-[#E53935] hover:bg-red-50 cursor-pointer'
                            : 'bg-white text-gray-800 border-gray-300 hover:border-black cursor-pointer'
                    }`}
                  >
                    <span>{size}</span>
                    <span className={`text-[9px] font-normal tracking-tight ${
                      isSoldOut
                        ? 'text-gray-400'
                        : selectedSize === size
                          ? 'text-red-300 font-semibold'
                          : stockQty <= 5
                            ? 'text-amber-600 font-bold'
                            : 'text-gray-500'
                    }`}>
                      {isSoldOut ? 'Sold Out' : stockQty <= 5 ? `${stockQty} left` : `${stockQty} left`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Validation Error Message */}
            {sizeError && (
              <div className="mt-2.5 p-2 bg-red-50 border border-red-200 text-[#E53935] text-xs font-bold flex items-center gap-1.5 rounded animate-bounce">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Please select a size before adding to cart!</span>
              </div>
            )}
          </div>

          {/* 4. Quantity Selector */}
          <div className="p-4 bg-white border-b border-gray-200 mt-2 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-800">QUANTITY</span>
            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
              <button 
                type="button"
                onClick={() => setQty(prev => Math.max(1, prev - 1))}
                className="w-9 h-8 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200"
              >
                -
              </button>
              <span className="w-10 text-center font-mono font-bold text-xs">{qty}</span>
              <button 
                type="button"
                disabled={selectedSize && qty >= maxAvailableQty}
                onClick={() => setQty(prev => Math.min(maxAvailableQty, prev + 1))}
                className={`w-9 h-8 flex items-center justify-center font-bold ${
                  selectedSize && qty >= maxAvailableQty
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 cursor-pointer'
                }`}
              >
                +
              </button>
            </div>
          </div>

          {/* 5. Product Description & Highlights */}
          <div className="p-4 bg-white border-b border-gray-200 mt-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-800 mb-2">
              Product Details
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {product.desc || "Premium quality men's fashion designed for confidence, comfort, and versatile everyday style."}
            </p>

            {/* Quality & Return Guarantees */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-600">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Quality Assured</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Easy Exchange</span>
              </div>
            </div>
          </div>

          {/* Write a Review Link */}
          {onWriteReview && (
            <div className="p-4 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onWriteReview(product);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E53935] hover:underline"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Have this item? Write a Review</span>
              </button>
            </div>
          )}

        </main>

        {/* 6. Fixed Add to Cart Button at the Bottom */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center gap-3">
          <div className="shrink-0">
            <span className="text-[10px] font-mono text-gray-400 block uppercase">Price</span>
            <span className="font-display font-black text-xl text-[#111111]">
              ₹{product.price * qty}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={addedNotice || isAllSoldOut}
            className={`flex-1 py-3.5 px-4 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
              isAllSoldOut
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : addedNotice
                  ? 'bg-emerald-600 text-white cursor-pointer'
                  : 'bg-[#E53935] hover:bg-[#D32F2F] text-white cursor-pointer'
            }`}
          >
            {isAllSoldOut ? (
              <span>OUT OF STOCK</span>
            ) : addedNotice ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Added to Bag!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{selectedSize ? `ADD TO CART • ${selectedSize} (${selectedSizeStock} Left)` : 'SELECT SIZE & ADD'}</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* =======================================================================
          DESKTOP MODAL (Visible ONLY on desktop/laptop screens: hidden md:flex)
          Completely untouched to preserve desktop layout integrity exactly.
          ======================================================================= */}
      <div 
        className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-4xl bg-[#FAFAFA] border-2 border-[#1A1A1A] shadow-origami-bold overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-white border border-[#1A1A1A] hover:bg-[#FF6B6B] hover:text-white transition-colors cursor-pointer shadow-sm"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Image Gallery Column - 3:4 Ratio, Clean White BG, Object-Contain, Multi-image thumbnails */}
            <div className="relative bg-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#B0B0B0] p-4 sm:p-6">
              
              {/* Main Image Frame */}
              <div className="relative aspect-[3/4] w-full flex items-center justify-center bg-white overflow-hidden rounded-sm border border-gray-100">
                <img 
                  src={imagesList[activeImgIndex] || imagesList[0]} 
                  alt={`${product.name} - view ${activeImgIndex + 1}`}
                  className="w-full h-full object-contain object-center transition-all duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Prev / Next Chevrons (when multiple images exist) */}
                {imagesList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white border border-[#1A1A1A] shadow-sm transition-all cursor-pointer z-10"
                      title="Previous Image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white border border-[#1A1A1A] shadow-sm transition-all cursor-pointer z-10"
                      title="Next Image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Image Counter Badge */}
                {imagesList.length > 1 && (
                  <div className="absolute top-3 right-3 bg-[#1A1A1A]/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded-sm">
                    {activeImgIndex + 1} / {imagesList.length}
                  </div>
                )}

                {/* Product SKU Label */}
                <div className="absolute bottom-3 left-3 bg-white/95 border border-[#1A1A1A] px-2.5 py-0.5 font-mono text-[10px]">
                  <span className="text-[#FF6B6B] font-bold">SF SKU:</span> {product.id}
                </div>
              </div>

              {/* Thumbnails Gallery Strip (up to 5 thumbnails) */}
              {imagesList.length > 1 && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 overflow-x-auto pb-1">
                  {imagesList.map((thumbUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImgIndex(idx)}
                      className={`relative w-14 h-16 sm:w-16 sm:h-20 bg-white border-2 rounded-sm overflow-hidden flex-shrink-0 transition-all p-1 cursor-pointer ${
                        activeImgIndex === idx
                          ? 'border-[#FF6B6B] shadow-sm ring-1 ring-[#FF6B6B]'
                          : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                      }`}
                      title={`View angle ${idx + 1}`}
                    >
                      <img 
                        src={thumbUrl} 
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain object-center"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#1A1A1A] text-white text-[8px] font-mono font-bold uppercase text-center py-0.2">
                          Cover
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* Details Column */}
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                {/* Category, Rating & Write Review Link */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B6B]">
                      {product.category}
                    </span>
                    <span className="text-[#B0B0B0]">•</span>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#1A1A1A]">
                      <Star className="w-3.5 h-3.5 fill-[#FF6B6B] text-[#FF6B6B]" />
                      <span>{product.rating || '4.9'}</span>
                    </div>
                  </div>

                  {onWriteReview && (
                    <button
                      type="button"
                      onClick={() => onWriteReview(product)}
                      className="text-[11px] font-mono text-[#FF6B6B] hover:text-[#1A1A1A] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      title={`Review ${product.name}`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Write Review</span>
                    </button>
                  )}
                </div>

                <h2 className="text-2xl font-display font-black text-[#1A1A1A] mb-3">
                  {product.name}
                </h2>

                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-display font-black text-[#1A1A1A]">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm font-mono text-[#B0B0B0] line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/30">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#4A4A4A] leading-relaxed mb-6">
                  {product.desc}
                </p>

                {/* Size Selector (Mandatory before Add to Cart) */}
                <div className="mb-6">
                  <div className="flex justify-between items-center text-xs font-mono font-bold mb-2">
                    <span className="flex items-center gap-1.5">
                      <span>SELECT SIZE:</span>
                      {selectedSize ? (
                        <span className="text-emerald-600 font-black">({selectedSize} SELECTED)</span>
                      ) : (
                        <span className="text-[#FF6B6B] font-bold text-[11px]">* Required</span>
                      )}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setIsSizeGuideOpen(!isSizeGuideOpen)}
                      className="text-[#4A4A4A] underline cursor-pointer text-[11px]"
                    >
                      {isSizeGuideOpen ? 'Hide Guide' : 'Size Guide'}
                    </button>
                  </div>
                  
                  {isSizeGuideOpen && (
                    <div className="mb-3 p-2.5 bg-gray-50 border border-gray-200 text-xs font-mono">
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-gray-700">
                        <span className="font-bold">Size</span><span className="font-bold">Chest</span><span className="font-bold">Length</span><span className="font-bold">Shoulder</span>
                        <span>S</span><span>38"</span><span>27"</span><span>17"</span>
                        <span>M</span><span>40"</span><span>28"</span><span>18"</span>
                        <span>L</span><span>42"</span><span>29"</span><span>19"</span>
                        <span>XL</span><span>44"</span><span>30"</span><span>20"</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {displaySizes.map((s) => {
                      const stockQty = rawStockObj[s] !== undefined ? Number(rawStockObj[s]) : (product.sizes?.includes(s) ? (product.stock || 0) : 0);
                      const isSoldOut = stockQty <= 0;

                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isSoldOut}
                          onClick={() => {
                            if (isSoldOut) return;
                            setSelectedSize(s);
                            setSizeError(false);
                            if (qty > stockQty) setQty(Math.max(1, stockQty));
                          }}
                          className={`min-w-14 py-1.5 px-3 text-xs font-mono font-bold border transition-all flex flex-col items-center justify-center ${
                            isSoldOut
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50 line-through'
                              : selectedSize === s
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-origami-coral scale-105 ring-2 ring-[#FF6B6B] cursor-pointer'
                                : sizeError
                                  ? 'bg-white text-[#1A1A1A] border-[#FF6B6B] hover:border-[#1A1A1A] hover:bg-red-50/50 cursor-pointer'
                                  : 'bg-white text-[#1A1A1A] border-[#B0B0B0] hover:border-[#1A1A1A] hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <span>{s}</span>
                          <span className={`text-[9px] font-normal ${
                            isSoldOut
                              ? 'text-gray-400'
                              : selectedSize === s
                                ? 'text-red-300 font-semibold'
                                : stockQty <= 5
                                  ? 'text-amber-600 font-bold'
                                  : 'text-gray-500'
                          }`}>
                            {isSoldOut ? 'Out' : `${stockQty} left`}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {sizeError && (
                    <div className="mt-2.5 p-2 bg-red-50 border border-red-200 text-[#FF6B6B] text-xs font-mono font-bold flex items-center gap-1.5 animate-bounce">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Please tap or click a size above before adding to cart!</span>
                    </div>
                  )}
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs font-mono font-bold">QTY:</span>
                  <div className="flex items-center border border-[#1A1A1A] bg-white">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setQty(prev => Math.max(1, prev - 1));
                      }}
                      className="px-3 py-1 font-mono font-bold hover:bg-gray-100 cursor-pointer select-none active:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-mono font-bold text-sm select-none">{qty}</span>
                    <button 
                      type="button"
                      disabled={selectedSize && qty >= maxAvailableQty}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setQty(prev => Math.min(maxAvailableQty, prev + 1));
                      }}
                      className={`px-3 py-1 font-mono font-bold select-none ${
                        selectedSize && qty >= maxAvailableQty
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                          : 'hover:bg-gray-100 cursor-pointer active:bg-gray-200'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                <button 
                  type="button"
                  onClick={handleAdd}
                  disabled={addedNotice}
                  className={`w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 clip-origami-btn shadow-origami-bold transition-all cursor-pointer ${
                    addedNotice 
                      ? 'bg-[#A8D5BA] text-[#1A1A1A]' 
                      : 'bg-[#FF6B6B] hover:bg-[#fa5555] text-white'
                  }`}
                >
                  {addedNotice ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>ADD TO CART</span>
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-[#4A4A4A]">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-[#87CEEB]" /> Quality & Fit Guarantee
                  </span>
                  <span>Premium Quality Fabric</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
