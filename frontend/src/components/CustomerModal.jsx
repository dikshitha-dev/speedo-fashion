import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, CheckCircle, ShieldCheck, MapPin, 
  Package, Clock, LogOut, Edit3, ArrowRight, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function CustomerModal({ 
  isOpen, 
  onClose, 
  customer, 
  onLoginSuccess, 
  onLogout,
  onAddressUpdated 
}) {
  if (!isOpen) return null;

  // View state: 'login' | 'profile'
  const [view, setView] = useState(() => (customer ? 'profile' : 'login'));

  // Auth form inputs
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Profile Address form inputs
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressData, setAddressData] = useState({
    saved_address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSuccessMsg, setAddressSuccessMsg] = useState('');

  // Customer Orders state
  const [customerOrders, setCustomerOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (customer) {
      setView('profile');
      setAddressData({
        saved_address: customer.saved_address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || ''
      });
      loadOrders(customer.phone);
    } else {
      setView('login');
    }
  }, [customer, isOpen]);

  const loadOrders = async (userPhone) => {
    if (!userPhone) return;
    setIsLoadingOrders(true);
    try {
      const orders = await api.getCustomerOrders(userPhone);
      setCustomerOrders(orders);
    } catch (e) {
      console.warn('Failed to load customer orders:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Handle Direct Login (Name & Phone)
  const handleDirectLogin = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(0, 10);
    if (!name.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setAuthError('Mobile number must be exactly 10 digits.');
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      const activeCustomer = await api.customerAuth({ name: name.trim(), phone: cleanPhone });
      onLoginSuccess(activeCustomer);
      setView('profile');
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Save / Update Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressData.saved_address.trim()) {
      alert('Please enter your street address.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const updated = await api.updateCustomerProfile(customer.phone, addressData);
      onAddressUpdated(updated);
      setIsEditingAddress(false);
      setAddressSuccessMsg('Delivery address updated and saved to Supabase!');
      setTimeout(() => setAddressSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to update address: ' + (err.message || 'Network error'));
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-[#FAFAFA] border-2 border-[#1A1A1A] shadow-origami-bold my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#1A1A1A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B6B] flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg uppercase tracking-wide">
                {view === 'profile' ? 'CUSTOMER ACCOUNT' : 'CUSTOMER LOGIN'}
              </h3>
              <p className="text-[11px] font-mono text-gray-300">
                {view === 'profile' ? 'SAVED ADDRESS & ORDER ARCHIVE' : 'SPEEDO MEMBER PORTAL'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">

          {/* ======================================================== */}
          {/* VIEW: SIMPLE NAME + PHONE LOGIN */}
          {/* ======================================================== */}
          {view === 'login' && (
            <div className="space-y-6">
              <div className="border-b border-[#B0B0B0]/30 pb-4">
                <h4 className="font-display font-bold text-xl text-[#1A1A1A]">
                  Enter Speedo Fashions
                </h4>
                <p className="text-xs text-[#4A4A4A] mt-1">
                  Enter your full name and 10-digit mobile number to access your account.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleDirectLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1A1A1A] uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Siddharth Verma"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#B0B0B0] focus:outline-none focus:border-[#1A1A1A] shadow-inner font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1A1A1A] uppercase mb-1">
                    Mobile Number *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-xs font-mono font-bold bg-gray-200 border border-r-0 border-[#B0B0B0] text-gray-700">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#B0B0B0] focus:outline-none focus:border-[#1A1A1A] shadow-inner font-mono font-bold"
                    />
                  </div>
                  {phone && phone.length !== 10 && (
                    <p className="mt-1 text-xs text-red-600 font-mono">
                      Mobile number must be exactly 10 digits ({phone.length}/10 entered).
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !name.trim() || phone.length !== 10}
                  className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#FF6B6B] text-white text-xs font-bold uppercase tracking-wider clip-origami-btn shadow-origami transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>{isLoading ? 'Logging in...' : 'Login'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: LOGGED-IN CUSTOMER PROFILE & SAVED ADDRESS */}
          {/* ======================================================== */}
          {view === 'profile' && customer && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-5 bg-white border border-[#B0B0B0]/60 shadow-origami flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-[#1A1A1A] text-white flex items-center justify-center text-lg font-display font-black rounded-full border-2 border-[#FF6B6B]">
                    {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h4 className="font-display font-black text-lg text-[#1A1A1A]">
                      {customer.name || 'Valued Member'}
                    </h4>
                    <p className="text-xs font-mono text-[#4A4A4A] flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#FF6B6B]" />
                      +91 {customer.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>

              {/* Status Message */}
              {addressSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{addressSuccessMsg}</span>
                </div>
              )}

              {/* Saved Address Section */}
              <div className="bg-white border border-[#B0B0B0]/60 p-5 shadow-origami">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF6B6B]" />
                    <h5 className="font-display font-bold text-sm text-[#1A1A1A] uppercase tracking-wide">
                      Saved Delivery Address
                    </h5>
                  </div>
                  <button
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-xs font-mono font-bold text-[#FF6B6B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingAddress ? 'Cancel' : customer.saved_address ? 'Edit Address' : '+ Add Address'}</span>
                  </button>
                </div>

                {isEditingAddress ? (
                  /* Edit Address Form */
                  <form onSubmit={handleSaveAddress} className="space-y-3.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1A1A1A] uppercase mb-1">
                        Street Address / Apartment / Landmark *
                      </label>
                      <textarea
                        required
                        rows="2"
                        value={addressData.saved_address}
                        onChange={(e) => setAddressData({ ...addressData, saved_address: e.target.value })}
                        placeholder="Flat 402, Lotus Residency, 12th Main Road..."
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#B0B0B0] focus:outline-none focus:bg-white focus:border-[#1A1A1A]"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-[#1A1A1A] uppercase mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          placeholder="Bengaluru"
                          className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#B0B0B0] focus:outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-[#1A1A1A] uppercase mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={addressData.state}
                          onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                          placeholder="Karnataka"
                          className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#B0B0B0] focus:outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-[#1A1A1A] uppercase mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={addressData.pincode}
                          onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                          placeholder="560038"
                          className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#B0B0B0] focus:outline-none focus:bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-3 py-1.5 text-xs border border-gray-300 hover:bg-gray-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingAddress}
                        className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#FF6B6B] text-white text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingAddress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        <span>Save Address to Supabase</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Display Saved Address */
                  <div>
                    {customer.saved_address ? (
                      <div className="bg-gray-50 p-3.5 border border-gray-200 flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-[#FF6B6B] shrink-0 mt-0.5" />
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-[#1A1A1A]">{customer.saved_address}</p>
                          {(customer.city || customer.state || customer.pincode) && (
                            <p className="text-[#4A4A4A] font-mono">
                              {[customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')}
                            </p>
                          )}
                          <span className="inline-block mt-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                            ✓ Automatically applied during checkout
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center border border-dashed border-gray-300 text-xs text-gray-500 font-mono">
                        No delivery address saved yet. 
                        <button 
                          onClick={() => setIsEditingAddress(true)}
                          className="ml-2 text-[#FF6B6B] font-bold underline cursor-pointer"
                        >
                          Add Address Now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* My Orders Section */}
              <div className="bg-white border border-[#B0B0B0]/60 p-5 shadow-origami">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#87CEEB]" />
                    <h5 className="font-display font-bold text-sm text-[#1A1A1A] uppercase tracking-wide">
                      My Orders ({customerOrders.length})
                    </h5>
                  </div>
                  <button
                    onClick={() => loadOrders(customer.phone)}
                    disabled={isLoadingOrders}
                    className="text-xs text-gray-500 hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div className="py-6 text-center text-xs font-mono text-gray-400">
                    Loading your order history from Supabase...
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500 font-mono">
                    No orders found under +91 {customer.phone}. Place an order to start tracking!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {customerOrders.map((ord, idx) => (
                      <div key={ord.orderId || idx} className="p-3 bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#1A1A1A]">{ord.orderId}</span>
                            <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-gray-300 font-bold text-blue-800">
                              {ord.status || 'Pending'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {ord.items && ord.items.map(i => `${i.qty || 1}x ${i.name} (${i.size || 'M'})`).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-black text-sm text-[#1A1A1A]">₹{ord.total}</p>
                          <p className="text-[10px] font-mono text-gray-400">{ord.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

