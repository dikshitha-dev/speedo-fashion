import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, Truck, Sparkles, MapPin, Edit3, User, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  cart, 
  onOrderSuccess, 
  onNavigateToAdmin,
  customer,
  onOpenAccount,
  onUpdateCustomer 
}) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal >= 1499 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  const [formData, setFormData] = useState({
    customerName: customer ? (customer.name || '') : '',
    customerEmail: customer ? (customer.email || '') : '',
    customerPhone: customer ? (customer.phone || '') : '',
    shippingAddress: customer ? (customer.saved_address || '') : '',
    city: customer ? (customer.city || '') : '',
    state: customer ? (customer.state || '') : '',
    pincode: customer ? (customer.pincode || '') : '',
    paymentMethod: 'Cash on Delivery (COD)'
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync when customer changes or modal opens
  useEffect(() => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerName: customer.name || prev.customerName,
        customerEmail: customer.email || prev.customerEmail,
        customerPhone: customer.phone || prev.customerPhone,
        shippingAddress: customer.saved_address || prev.shippingAddress,
        city: customer.city || prev.city,
        state: customer.state || prev.state,
        pincode: customer.pincode || prev.pincode,
        paymentMethod: 'Cash on Delivery (COD)'
      }));
      // If customer already has saved address, don't force edit mode
      setIsEditingAddress(!customer.saved_address);
    } else {
      setIsEditingAddress(true);
    }
  }, [customer, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalAddress = isEditingAddress 
      ? [formData.shippingAddress, formData.city, formData.state, formData.pincode].filter(Boolean).join(', ')
      : (formData.shippingAddress || [formData.city, formData.state, formData.pincode].filter(Boolean).join(', '));

    if (!formData.customerName.trim() || !finalAddress.trim()) {
      setErrorMsg('Please enter your full name and delivery address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. If customer is logged in and saveToAccount is checked, update Supabase customer profile with this address
      if (customer && saveToAccount) {
        try {
          const updatedCust = await api.updateCustomerProfile(customer.phone, {
            saved_address: formData.shippingAddress,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          });
          if (onUpdateCustomer) onUpdateCustomer(updatedCust);
        } catch (addrErr) {
          console.warn('Address auto-save to account warning:', addrErr);
        }
      }

      // 2. Create the live order in Supabase with Cash on Delivery
      const orderPayload = {
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim() || 'customer@speedofashions.com',
        customerPhone: formData.customerPhone.trim() || (customer ? customer.phone : '+91 98765 43210'),
        shippingAddress: finalAddress,
        paymentMethod: 'Cash on Delivery (COD)',
        notes: 'Cash on Delivery order.',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          size: item.size || 'M',
          qty: item.qty || 1,
          price: item.price
        })),
        total: total
      };

      const result = await api.createOrder(orderPayload);
      setConfirmedOrder(result);
      onOrderSuccess(); // Clears shopping cart
    } catch (err) {
      setErrorMsg('Checkout failed: ' + (err.message || 'Please retry.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-[#FAFAFA] border-2 border-[#1A1A1A] shadow-origami-bold my-auto max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Always pinned at top) */}
        <div className="p-4 sm:p-5 bg-[#1A1A1A] text-white flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#FF6B6B]" />
            <div>
              <h3 className="font-display font-black text-base sm:text-lg uppercase tracking-wide">
                {confirmedOrder ? 'ORDER CONFIRMED & DISPATCHED' : 'SPEEDO FASHIONS CHECKOUT'}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-gray-300">
                CASH ON DELIVERY • DIRECT SUPABASE DISPATCH
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer rounded"
            title="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable if height exceeds screen) */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {confirmedOrder ? (
            /* Confirmation Screen */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 mx-auto bg-[#A8D5BA]/20 border-2 border-[#A8D5BA] flex items-center justify-center rounded-full">
                <CheckCircle className="w-9 h-9 text-[#2c7a4b]" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B6B]">
                  SPEEDO FASHIONS ORDER CONFIRMATION
                </span>
                <h4 className="text-xl sm:text-2xl font-display font-black text-[#1A1A1A] mt-1">
                  Thank You, {confirmedOrder.customerName}!
                </h4>
                <p className="text-xs font-mono text-[#4A4A4A] mt-1">
                  Your order has been recorded into Supabase and routed for dispatch.
                </p>
              </div>

              {/* Order Reference Box */}
              <div className="bg-white border-2 border-dashed border-[#1A1A1A] p-4 sm:p-5 shadow-origami max-w-md mx-auto text-left">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 text-xs font-mono">
                  <span className="text-[#B0B0B0]">TRACKING ID:</span>
                  <span className="font-black text-[#1A1A1A] text-sm">{confirmedOrder.orderId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 text-xs font-mono">
                  <span className="text-[#B0B0B0]">PAYMENT METHOD:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5">
                    Cash on Delivery (COD)
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 text-xs font-mono">
                  <span className="text-[#B0B0B0]">CURRENT STATUS:</span>
                  <span className="font-bold text-[#FF6B6B] bg-[#FF6B6B]/10 px-2 py-0.5">
                    {confirmedOrder.status || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 text-xs font-mono">
                  <span className="text-[#B0B0B0]">ITEMS COUNT:</span>
                  <span className="font-bold">{confirmedOrder.items ? confirmedOrder.items.length : cart.length} Pieces</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 text-xs font-mono">
                  <span className="text-[#B0B0B0]">DELIVERY TO:</span>
                  <span className="font-semibold text-gray-800 text-[11px] truncate max-w-[200px]">{confirmedOrder.shippingAddress}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-xs font-mono">
                  <span className="text-[#B0B0B0]">TOTAL DUE ON DELIVERY:</span>
                  <span className="font-black text-sm text-[#1A1A1A]">₹{confirmedOrder.total}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3 bg-[#1A1A1A] hover:bg-[#FF6B6B] text-white font-mono text-xs uppercase font-bold tracking-wider clip-origami-btn shadow-origami cursor-pointer transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              
              {/* Customer Account Strip / Banner */}
              {customer ? (
                <div className="p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-emerald-800 truncate">
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Member: <strong>{customer.name}</strong> (+91 {customer.phone})</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 px-2 py-0.5 font-bold text-emerald-900 shrink-0 ml-2">
                    Verified
                  </span>
                </div>
              ) : (
                <div className="p-2.5 sm:p-3 bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-900 truncate">
                    <Sparkles className="w-4 h-4 text-[#FF6B6B] shrink-0" />
                    <span className="truncate">Log in to auto-fill your saved address in 1 click.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenAccount) onOpenAccount();
                    }}
                    className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#FF6B6B] text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    Log In
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order Summary Strip */}
              <div className="bg-white border border-[#B0B0B0] p-3 sm:p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <span className="text-gray-500">BAG:</span>{' '}
                  <span className="font-bold">{cart.reduce((a, b) => a + b.qty, 0)} items</span>
                </div>
                <div>
                  <span className="text-gray-500">SUBTOTAL:</span>{' '}
                  <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">DELIVERY:</span>{' '}
                  <span className="font-bold">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div className="text-sm font-black text-[#FF6B6B]">
                  DUE: ₹{total.toFixed(2)}
                </div>
              </div>

              {/* Customer Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1 text-gray-800">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Siddharth Verma"
                    className="w-full p-2.5 text-xs bg-white border border-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#FF6B6B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1 text-gray-800">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    required
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full p-2.5 text-xs bg-white border border-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#FF6B6B] font-mono font-bold"
                  />
                </div>
              </div>

              {/* SAVED ADDRESS / DELIVERY ADDRESS LOGIC */}
              <div className="border border-[#B0B0B0] p-3.5 sm:p-4 bg-white shadow-origami">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF6B6B]" />
                    <span className="font-display font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                      Delivery Address
                    </span>
                  </div>

                  {customer && customer.saved_address && (
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(!isEditingAddress)}
                      className="text-xs font-mono font-bold text-[#FF6B6B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingAddress ? 'Use Saved Address' : 'Change Address'}</span>
                    </button>
                  )}
                </div>

                {/* Case 1: Has Saved Address and Not Editing -> 1-Click Auto Address */}
                {customer && customer.saved_address && !isEditingAddress ? (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Using Saved Address from Account:</span>
                    </div>
                    <p className="text-[#1A1A1A] font-semibold">{customer.saved_address}</p>
                    {(customer.city || customer.state || customer.pincode) && (
                      <p className="text-gray-600 font-mono text-[11px] mt-0.5">
                        {[customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Case 2: First Checkout or Editing Address */
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase mb-1 text-gray-800">
                        Street Address / Apartment / Landmark *
                      </label>
                      <textarea
                        rows="2"
                        name="shippingAddress"
                        required
                        value={formData.shippingAddress}
                        onChange={handleChange}
                        placeholder="Flat/House No, Building, Street, Landmark..."
                        className="w-full p-2.5 text-xs bg-white border border-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#FF6B6B]"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase mb-1 text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Mumbai"
                          className="w-full p-2 text-xs bg-white border border-[#B0B0B0] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase mb-1 text-gray-700">
                          State
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="Maharashtra"
                          className="w-full p-2 text-xs bg-white border border-[#B0B0B0] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase mb-1 text-gray-700">
                          Pincode
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          placeholder="400050"
                          className="w-full p-2 text-xs bg-white border border-[#B0B0B0] focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {customer && (
                      <label className="flex items-center gap-2 text-xs font-mono text-gray-700 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={saveToAccount}
                          onChange={(e) => setSaveToAccount(e.target.checked)}
                          className="w-3.5 h-3.5 text-[#FF6B6B] rounded border-gray-300 focus:ring-[#FF6B6B]"
                        />
                        <span>Save this address to my account for future orders</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method - Cash on Delivery Only */}
              <div className="border border-[#1A1A1A] bg-white p-3.5 shadow-sm">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-gray-800 mb-1.5">
                  Payment Method
                </label>
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-300">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-950 font-mono tracking-wide block">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[10px] text-emerald-800 font-sans block">
                        Pay with cash or UPI QR at your doorstep upon delivery.
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 uppercase tracking-wider shrink-0 ml-2">
                    Default
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#FF6B6B] hover:bg-[#fa5555] text-white font-bold text-xs uppercase tracking-wider clip-origami-btn shadow-origami-bold hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Placing COD Order in Supabase...' : `Confirm & Place COD Order (₹${total.toFixed(2)})`}
                  </span>
                </button>
                <p className="text-[10px] font-mono text-center text-gray-400 mt-2">
                  🔒 Cash on Delivery order recorded directly to Supabase orders table.
                </p>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
