import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, onUpdateQty, onRemove, onProceedCheckout }) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal >= 1499 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#1A1A1A]/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="fixed inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md bg-[#FAFAFA] border-l-2 border-[#1A1A1A] shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 bg-[#1A1A1A] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#FF6B6B]" />
              <h2 className="font-display font-black text-lg tracking-wide uppercase">
                YOUR CART ({cart.reduce((a, b) => a + b.qty, 0)})
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:text-[#FF6B6B] transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 border border-[#B0B0B0] flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-[#B0B0B0]" />
                </div>
                <p className="font-display font-bold text-lg text-[#1A1A1A]">Your bag is empty</p>
                <p className="text-xs font-mono text-[#4A4A4A] mt-1 mb-6">
                  Select products from our collection.
                </p>
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#FF6B6B] text-white font-bold text-xs uppercase clip-origami-btn shadow-origami"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.map((item, index) => (
                <div 
                  key={`${item.id}-${item.size}-${index}`}
                  className="p-4 bg-white border border-[#B0B0B0]/60 shadow-origami flex gap-4 relative group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-gray-100 flex-shrink-0 overflow-hidden border border-[#B0B0B0]/40">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-display font-bold text-sm text-[#1A1A1A] leading-snug">
                          {item.name}
                        </h4>
                        <button 
                          onClick={() => onRemove(index)}
                          className="text-[#B0B0B0] hover:text-[#FF6B6B] transition-colors p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 border border-gray-300 font-bold">
                          SIZE: {item.size}
                        </span>
                        <span className="text-xs font-display font-bold text-[#FF6B6B]">
                          ₹{item.price} each
                        </span>
                      </div>
                    </div>

                    {/* Qty and Subtotal */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center border border-[#1A1A1A] bg-white">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onUpdateQty(index, -1);
                          }}
                          className="px-2.5 py-1 font-mono text-xs hover:bg-gray-100 cursor-pointer font-bold select-none active:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-mono text-xs font-bold select-none">{item.qty}</span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onUpdateQty(index, 1);
                          }}
                          className="px-2.5 py-1 font-mono text-xs hover:bg-gray-100 cursor-pointer font-bold select-none active:bg-gray-200"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-display font-black text-sm text-[#1A1A1A]">
                        ₹{item.price * item.qty}
                      </span>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-6 bg-white border-t-2 border-[#1A1A1A] space-y-4">
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-[#4A4A4A]">
                  <span>SUBTOTAL</span>
                  <span className="font-bold text-[#1A1A1A]">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#4A4A4A]">
                  <span>DELIVERY CHARGES</span>
                  <span className="font-bold text-[#1A1A1A]">
                    {shipping === 0 ? <span className="text-[#A8D5BA] font-bold">FREE (₹1,499+ BONUS)</span> : `₹${shipping}.00`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-display font-black text-[#1A1A1A] pt-2 border-t border-gray-200">
                  <span>TOTAL ESTIMATE</span>
                  <span className="text-[#FF6B6B]">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={onProceedCheckout}
                className="w-full py-3.5 bg-[#FF6B6B] hover:bg-[#fa5555] text-white font-bold text-xs uppercase tracking-wider clip-origami-btn shadow-origami-bold hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#B0B0B0]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#87CEEB]" />
                <span>Orders immediately sync with Speedo Admin CRM</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

