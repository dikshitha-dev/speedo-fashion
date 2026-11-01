import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Star, CheckCircle, Shield, Scissors, AlertCircle, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

export default function ProductModal({ product, isOpen, onClose, onAddToCart, onWriteReview }) {
  if (!isOpen || !product) return null;

  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Normalize multi-images array (up to 5 images)
  const imagesList = React.useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    if (product.image) {
      return [product.image];
    }
    return ['https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80'];
  }, [product]);

  useEffect(() => {
    setSelectedSize('');
    setQty(1);
    setSizeError(false);
    setAddedNotice(false);
    setActiveImgIndex(0);
  }, [product]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const handleAdd = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    onAddToCart(product, selectedSize, qty);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 900);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-sm animate-fadeIn"
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
                  <span className="text-[#4A4A4A] underline cursor-pointer text-[11px]">Size Guide</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || ['S', 'M', 'L', 'XL']).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedSize(s);
                        setSizeError(false);
                      }}
                      className={`min-w-11 py-2 px-3 text-xs font-mono font-bold border transition-all cursor-pointer ${
                        selectedSize === s
                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-origami-coral scale-105 ring-2 ring-[#FF6B6B]'
                          : sizeError
                            ? 'bg-white text-[#1A1A1A] border-[#FF6B6B] hover:border-[#1A1A1A] hover:bg-red-50/50'
                            : 'bg-white text-[#1A1A1A] border-[#B0B0B0] hover:border-[#1A1A1A] hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQty(prev => prev + 1);
                    }}
                    className="px-3 py-1 font-mono font-bold hover:bg-gray-100 cursor-pointer select-none active:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <button 
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
  );
}
