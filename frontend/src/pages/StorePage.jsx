import React, { useState } from 'react';
import Hero from '../components/Hero';
import ProductCatalog from '../components/ProductCatalog';
import ProductModal from '../components/ProductModal';
import Testimonials from '../components/Testimonials';
import FinalCTA from '../components/FinalCTA';
import ReviewModal from '../components/ReviewModal';

export default function StorePage({
  products,
  categories,
  cart,
  customer,
  onOpenAccount,
  onAddToCart,
  onOpenCart,
  onOpenCheckout,
  onRefreshProducts,
  isLoadingProducts
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  
  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  const handleAddToCartWithToast = (product, size, qty = 1) => {
    onAddToCart(product, size, qty);
    triggerToast(`Added ${qty}x ${product.name} (${size || 'M'}) to Cart`);
  };

  const handleOpenReviewModal = (product = null) => {
    setReviewingProduct(product);
    setIsReviewModalOpen(true);
  };

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1A1A] text-white px-5 py-3 shadow-origami-bold border-l-4 border-[#FF6B6B] font-mono text-xs flex items-center gap-3 animate-bounce">
          <span className="w-2 h-2 bg-[#FF6B6B] transform rotate-45"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Section */}
      <Hero 
        onExploreClick={() => {
          const catEl = document.getElementById('catalog');
          if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Product Catalog Section */}
      <ProductCatalog 
        products={products}
        categories={categories}
        onAddToCart={(p) => setSelectedProduct(p)}
        onQuickView={(p) => setSelectedProduct(p)}
        onRefresh={onRefreshProducts}
        isLoading={isLoadingProducts}
        onWriteReview={handleOpenReviewModal}
      />

      {/* Verified Customer Reviews Section */}
      <div id="reviews">
        <Testimonials 
          customer={customer} 
          onOpenAccount={onOpenAccount} 
          onWriteReview={handleOpenReviewModal}
        />
      </div>

      {/* Final CTA */}
      <FinalCTA 
        onExploreClick={() => {
          const catEl = document.getElementById('catalog');
          if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Quick View / Product Details Modal */}
      <ProductModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCartWithToast}
        onWriteReview={handleOpenReviewModal}
      />

      {/* Customer Review Submission Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewingProduct(null);
        }}
        customer={customer}
        initialProduct={reviewingProduct}
        products={products}
        onReviewSubmitted={() => {
          triggerToast('Review submitted! It will appear after moderation.');
        }}
      />
    </div>
  );
}
