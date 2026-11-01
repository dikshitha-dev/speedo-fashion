import React, { useState, useEffect } from 'react';
import {
  Star, Quote, CheckCircle2, MessageSquarePlus, Send,
  AlertCircle, CheckCircle, ShieldCheck, Sparkles, X, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../services/api';

// Individual Review Card with "Read More" toggle for longer comments
function ReviewCard({ review }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const commentText = review.comment || review.quote || '';
  const isLong = commentText.length > 130;
  const displayText = isLong && !isExpanded ? `${commentText.slice(0, 130)}...` : commentText;

  return (
    <div className="faceted-surface p-7 shadow-origami hover:shadow-origami-bold flex flex-col justify-between group transition-all duration-300 bg-white border border-[#B0B0B0]/40 hover:-translate-y-1">
      <div>
        {/* Header: Stars & Quote Icon */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-[#FF6B6B]">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (Number(review.rating) || 5)
                    ? 'fill-[#FF6B6B] text-[#FF6B6B]'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <Quote className="w-6 h-6 text-[#B0B0B0] group-hover:text-[#FF6B6B] transition-colors" />
        </div>

        {/* Product Tag / Category */}
        <div className="mb-2.5">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 bg-gray-100 text-[#1A1A1A] border border-gray-200 inline-block">
            {review.productName || review.item || 'Speedo Couture'}
          </span>
        </div>

        {/* Review Title */}
        {(review.reviewTitle || review.title) && (
          <h4 className="font-display font-bold text-base text-[#1A1A1A] mb-2 leading-snug">
            {review.reviewTitle || review.title}
          </h4>
        )}

        {/* Comment Text with Read More */}
        <p className="text-xs text-[#333333] leading-relaxed italic mb-3 font-sans">
          "{displayText}"
        </p>

        {isLong && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-mono text-[#FF6B6B] hover:text-[#1A1A1A] font-bold flex items-center gap-1 cursor-pointer mb-3 transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Show Less</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Read More</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Footer: Reviewer Name, Verified Purchase & Date */}
      <div className="pt-4 border-t border-[#B0B0B0]/30 mt-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h5 className="font-display font-bold text-xs text-[#1A1A1A]">
              {review.customerName || review.name || 'Speedo Customer'}
            </h5>
            <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
              {review.date || (review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Verified Wearer')}
            </span>
          </div>

          {/* Verified Purchase Badge (Only shown when verified) */}
          {(review.verifiedPurchase || review.verified) && (
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 flex items-center gap-1 font-bold shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified Purchase</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Testimonials({ customer, onOpenAccount, onWriteReview }) {
  const [reviewsList, setReviewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch approved customer reviews
  const loadApprovedReviews = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReviews();
      if (Array.isArray(data)) {
        setReviewsList(data);
      }
    } catch (err) {
      console.warn('Failed to load approved reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovedReviews();
  }, []);

  // Compute average rating
  const avgRating = reviewsList.length > 0
    ? (reviewsList.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1)
    : '5.0';

  return (
    <section id="reviews" className="py-24 bg-[#FAFAFA] relative border-b border-[#B0B0B0]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#B0B0B0]/40 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#1A1A1A] text-xs font-mono font-bold tracking-wider mb-2">
              <span className="w-2 h-2 bg-[#FF6B6B]"></span>
              REAL CUSTOMER STORIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-[#1A1A1A] tracking-tight">
              WHAT THEY SAY ABOUT <span className="text-[#FF6B6B]">US</span>
            </h2>
            <p className="text-xs text-[#4A4A4A] font-sans mt-1">
              Honest feedback from men who wear Speedo. Real experiences, genuine style, and everyday comfort.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Rating Summary Box */}
            <div className="flex items-center gap-2 font-mono text-xs text-[#4A4A4A] bg-white px-3.5 py-2 border border-[#B0B0B0]/40 shadow-sm">
              <span className="font-bold text-[#1A1A1A] text-sm">{avgRating}</span>
              <div className="flex text-[#FF6B6B]">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(Number(avgRating)) ? 'fill-[#FF6B6B]' : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-gray-500">({reviewsList.length} Approved Reviews)</span>
            </div>

            {/* Leave Feedback / Write a Review Button */}
            <button
              onClick={() => {
                if (onWriteReview) {
                  onWriteReview(null);
                }
              }}
              className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#FF6B6B] text-white text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 flex items-center gap-2 shadow-origami hover:shadow-origami-bold cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 text-[#FF6B6B] group-hover:text-white" />
              <span>LEAVE FEEDBACK</span>
            </button>
          </div>
        </div>

        {/* REVIEWS GRID (Only Approved Reviews) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="faceted-surface p-8 animate-pulse bg-gray-100 min-h-[220px]">
                <div className="h-4 bg-gray-200 w-24 mb-4"></div>
                <div className="h-3 bg-gray-200 w-full mb-2"></div>
                <div className="h-3 bg-gray-200 w-3/4 mb-6"></div>
                <div className="h-3 bg-gray-200 w-1/3"></div>
              </div>
            ))}
          </div>
        ) : reviewsList.length === 0 ? (
          <div className="faceted-surface p-12 text-center border border-dashed border-[#B0B0B0] bg-white">
            <Quote className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h4 className="font-display font-bold text-base text-[#1A1A1A] uppercase">
              No Approved Reviews Yet
            </h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4 font-sans">
              Be the first to submit a review for Speedo Fashions garments!
            </p>
            <button
              onClick={() => onWriteReview && onWriteReview(null)}
              className="px-5 py-2.5 bg-[#FF6B6B] hover:bg-[#E53935] text-white text-xs font-mono font-bold uppercase tracking-wider"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviewsList.map((review) => (
              <ReviewCard key={review.id || review.reviewId} review={review} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
