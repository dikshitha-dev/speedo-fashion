import React, { useState, useEffect } from 'react';
import { X, Star, Sparkles, Send, CheckCircle2, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function ReviewModal({
  isOpen,
  onClose,
  customer,
  initialProduct = null,
  products = [],
  onReviewSubmitted
}) {
  if (!isOpen) return null;

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [comment, setComment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Prepopulate customer and product details on open
  useEffect(() => {
    if (customer?.name) {
      setCustomerName(customer.name);
    } else if (customer?.phone) {
      setCustomerName(`Valued Customer (${customer.phone.slice(-4)})`);
    } else {
      setCustomerName('');
    }

    if (initialProduct) {
      setSelectedProductId(initialProduct.id || '');
      setSelectedProductName(initialProduct.name || '');
    } else if (products && products.length > 0) {
      setSelectedProductId(products[0].id || '');
      setSelectedProductName(products[0].name || '');
    } else {
      setSelectedProductId('');
      setSelectedProductName('');
    }

    setRating(5);
    setHoverRating(0);
    setReviewTitle('');
    setComment('');
    setSuccessMsg('');
    setErrorMsg('');
  }, [isOpen, customer, initialProduct, products]);

  // Handle product dropdown change
  const handleProductSelect = (e) => {
    const pId = e.target.value;
    setSelectedProductId(pId);
    const found = products.find(p => String(p.id) === String(pId));
    setSelectedProductName(found ? found.name : '');
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 5: return '5 Stars — Outstanding Couture Quality';
      case 4: return '4 Stars — Great Fit, Style & Comfort';
      case 3: return '3 Stars — Good, Average Experience';
      case 2: return '2 Stars — Below Expectations';
      case 1: return '1 Star — Unsatisfactory';
      default: return 'Select your rating';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    const cleanName = customerName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter your name to sign your review.');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg('Please select a star rating between 1 and 5.');
      return;
    }

    const cleanComment = comment.trim();
    if (!cleanComment) {
      setErrorMsg('Please write your review comment before submitting.');
      return;
    }

    if (cleanComment.length < 8) {
      setErrorMsg('Please provide a slightly more descriptive review (at least 8 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_id: customer?.phone || customer?.id || 'guest',
        customer_name: cleanName,
        customer_phone: customer?.phone || '',
        product_id: selectedProductId || (initialProduct ? initialProduct.id : ''),
        product_name: selectedProductName || (initialProduct ? initialProduct.name : 'Speedo Apparel'),
        rating: Number(rating),
        review_title: reviewTitle.trim() || (Number(rating) >= 4 ? 'Great Experience' : 'Product Review'),
        comment: cleanComment
      };

      const result = await api.submitReview(payload);

      if (result && result.success !== false) {
        setSuccessMsg(
          result.message || 'Thank you! Your review has been submitted for moderation and will appear on the storefront once approved.'
        );
        if (onReviewSubmitted) onReviewSubmitted();
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMsg(result?.message || 'Could not submit review. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setErrorMsg(err.message || 'An error occurred while saving your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white border-2 border-[#1A1A1A] shadow-origami-bold overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="bg-[#1A1A1A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF6B6B]" />
            <h3 className="font-display font-black text-sm tracking-wider uppercase">
              WRITE A CUSTOMER REVIEW
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:text-[#FF6B6B] transition-colors cursor-pointer text-gray-300"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
          {successMsg ? (
            <div className="p-6 bg-emerald-50 border border-emerald-300 text-center rounded-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h4 className="font-display font-bold text-lg text-emerald-900 mb-1">
                Review Submitted Successfully!
              </h4>
              <p className="text-xs text-emerald-700 font-sans leading-relaxed">
                {successMsg}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Product Info / Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#FF6B6B]" />
                  <span>Garment Being Reviewed *</span>
                </label>
                {initialProduct ? (
                  <div className="p-3 bg-gray-50 border border-[#B0B0B0]/60 flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-sm text-[#1A1A1A]">{initialProduct.name}</p>
                      <p className="text-[10px] font-mono text-gray-500 uppercase">{initialProduct.category || 'Apparel'} • ₹{initialProduct.price}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-[#1A1A1A] text-white px-2 py-0.5 font-bold uppercase">
                      Selected
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={handleProductSelect}
                    className="w-full p-2.5 bg-white border border-[#B0B0B0] text-xs font-mono font-medium text-[#1A1A1A] focus:border-[#FF6B6B] focus:outline-none"
                    required
                  >
                    {products.length === 0 ? (
                      <option value="">Speedo Fashions Apparel Collection</option>
                    ) : (
                      products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category || 'Garment'}) — ₹{p.price}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Your Full Name *
                </label>
                <input 
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full p-2.5 bg-white border border-[#B0B0B0] text-xs font-sans text-[#1A1A1A] focus:border-[#FF6B6B] focus:outline-none"
                  required
                />
                {customer?.phone && (
                  <p className="text-[10px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified buyer linked with phone: {customer.phone}
                  </p>
                )}
              </div>

              {/* Star Rating Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled = starVal <= (hoverRating || rating);
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(starVal)}
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-2xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                          title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                        >
                          <Star 
                            className={`w-7 h-7 transition-colors ${
                              isFilled 
                                ? 'fill-[#FF6B6B] text-[#FF6B6B]' 
                                : 'text-gray-300 hover:text-[#FF6B6B]/50'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-mono font-bold text-[#FF6B6B] ml-2">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                </div>
              </div>

              {/* Review Title (Optional) */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Review Headline / Title <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input 
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Exceptional fit and comfortable fabric"
                  className="w-full p-2.5 bg-white border border-[#B0B0B0] text-xs font-sans text-[#1A1A1A] focus:border-[#FF6B6B] focus:outline-none"
                />
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Detailed Feedback / Experience *
                </label>
                <textarea 
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the fabric texture, size fit, packaging, or technical silhouette..."
                  className="w-full p-3 bg-white border border-[#B0B0B0] text-xs font-sans text-[#1A1A1A] focus:border-[#FF6B6B] focus:outline-none leading-relaxed resize-none"
                  required
                />
                <span className="text-[10px] font-mono text-gray-400 block text-right mt-1">
                  {comment.length} characters
                </span>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button & Moderation Notice */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#FF6B6B] hover:bg-[#E53935] disabled:bg-gray-400 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-origami transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting For Verification...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Review For Moderation</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] font-mono text-gray-500 text-center mt-2.5">
                  All customer reviews undergo quality moderation before appearing on the public storefront.
                </p>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}

