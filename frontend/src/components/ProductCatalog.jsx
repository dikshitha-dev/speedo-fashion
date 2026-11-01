import React, { useState } from 'react';
import { ShoppingBag, Eye, Star, Sparkles, Filter, RefreshCw, MessageSquare } from 'lucide-react';

export default function ProductCatalog({ products, categories = [], onAddToCart, onQuickView, onRefresh, isLoading, onWriteReview }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categoryList = React.useMemo(() => {
    if (categories && categories.length > 0) {
      return ['All', ...categories.map(c => c.name)];
    }
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return ['All', ...(set.size > 0 ? Array.from(set) : ['Outerwear', 'Couture', 'Tops', 'Bottoms'])];
  }, [categories, products]);

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => (p.category || '').toLowerCase() === selectedCategory.toLowerCase());

  return (
    <section id="catalog" className="py-24 bg-[#FAFAFA] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header and Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] text-white text-xs font-mono font-bold tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B6B]" />
              CATALOGUE ARCHIVE • REAL-TIME SYNC
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-[#1A1A1A] tracking-tight">
              MEN'S FASHION <span className="text-[#FF6B6B]">STORE</span>
            </h2>
            <p className="text-sm text-[#4A4A4A] mt-1">
              Discover trendy men's fashion, everyday essentials, and statement styles designed for comfort and confidence.
            </p>
          </div>

          {/* Category Filter Pills & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh from Admin Database"
              className="p-2 border border-[#1A1A1A] bg-white shadow-origami hover:bg-[#1A1A1A] hover:text-white transition-all cursor-pointer mr-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FF6B6B]' : ''}`} />
            </button>

            {categoryList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold uppercase tracking-wider px-4 py-2 border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-origami-coral'
                    : 'bg-white text-[#1A1A1A] border-[#B0B0B0] hover:border-[#1A1A1A] shadow-origami'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-[#B0B0B0] bg-white">
            <p className="font-mono text-sm text-[#4A4A4A]">No products found in this category.</p>
            <button 
              onClick={() => setSelectedCategory('All')}
              className="mt-4 px-4 py-2 bg-[#FF6B6B] text-white font-bold text-xs uppercase clip-origami-btn"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => onQuickView(product)}
                className="faceted-surface shadow-origami hover:shadow-origami-bold border border-[#B0B0B0]/50 flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:-translate-y-1"
                title={`Click to view details & choose size for ${product.name}`}
              >
                {/* Product Image Area - Clean White BG, 3:4 Aspect Ratio, Object-Contain */}
                <div className="relative aspect-[3/4] overflow-hidden bg-white flex items-center justify-center p-3 border-b border-[#B0B0B0]/40">
                  <img 
                    src={(Array.isArray(product.images) && product.images[0]) || product.image} 
                    alt={product.name}
                    className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  {/* Corner Badge */}
                  {product.badge && (
                    <div className="absolute top-3 left-3 bg-[#1A1A1A] text-white text-[10px] font-mono font-bold uppercase px-3 py-1 shadow-sm clip-origami-badge">
                      {product.badge}
                    </div>
                  )}

                  {/* Origami Tag */}
                  {product.tag && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-[#1A1A1A] border border-[#1A1A1A] text-[9px] font-mono font-bold uppercase px-2.5 py-0.5">
                      {product.tag}
                    </div>
                  )}
                </div>

                {/* Product Details Area */}
                <div className="p-6 flex flex-col flex-grow justify-between">
                  <div>
                    {/* Category & Rating */}
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-[#4A4A4A] uppercase tracking-wider">{product.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[#1A1A1A] font-bold">
                          <Star className="w-3.5 h-3.5 fill-[#FF6B6B] text-[#FF6B6B]" />
                          <span>{product.rating || '4.9'}</span>
                          <span className="text-[#B0B0B0] font-normal">({product.reviewsCount || 42})</span>
                        </div>
                        {onWriteReview && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onWriteReview(product);
                            }}
                            className="text-[10px] font-mono text-[#FF6B6B] hover:text-[#1A1A1A] hover:underline flex items-center gap-0.5 cursor-pointer"
                            title={`Write review for ${product.name}`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Review</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="font-display font-bold text-lg text-[#1A1A1A] group-hover:text-[#FF6B6B] transition-colors leading-tight mb-2">
                      {product.name}
                    </h3>

                    {/* Description excerpt */}
                    <p className="text-xs text-[#4A4A4A] line-clamp-2 leading-relaxed mb-4">
                      {product.desc}
                    </p>

                    {/* Available Sizes */}
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-[10px] font-mono text-[#B0B0B0] uppercase mr-1">SIZES:</span>
                      {(product.sizes || ['S', 'M', 'L']).map(size => (
                        <span key={size} className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-gray-100 border border-gray-300 text-[#1A1A1A]">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price & Add to Cart Action */}
                  <div className="pt-4 border-t border-[#B0B0B0]/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-black text-2xl text-[#1A1A1A]">
                          ₹{product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-[#B0B0B0] line-through font-mono">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="bg-[#1A1A1A] hover:bg-[#FF6B6B] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 shadow-origami hover:shadow-origami-bold hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Select size to add to cart"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>ADD TO CART</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}

