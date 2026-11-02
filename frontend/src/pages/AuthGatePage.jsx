import React, { useState } from 'react';
import { User, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function AuthGatePage({ onAuthenticated }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Allow only numeric input and restrict to at most 10 digits
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const numericOnly = rawVal.replace(/\D/g, '').slice(0, 10);
    setPhone(numericOnly);

    // Dynamic validation messaging
    if (numericOnly.length === 0) {
      setPhoneError('');
    } else if (numericOnly.length < 10) {
      setPhoneError(`Mobile number must be exactly 10 digits (${numericOnly.length}/10 entered).`);
    } else {
      setPhoneError('');
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameError && e.target.value.trim().length > 0) {
      setNameError('');
    }
  };

  // Validation status
  const isNameValid = name.trim().length > 0;
  const isPhoneValid = phone.length === 10;
  const isFormValid = isNameValid && isPhoneValid;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Please enter your full name.');
      return;
    }

    if (phone.length !== 10) {
      setPhoneError(`Mobile number must be exactly 10 digits (${phone.length}/10 entered).`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Authenticate customer securely via backend API (service role bypasses RLS safely on server)
      const activeCustomer = await api.customerAuth({
        name: trimmedName,
        phone: phone
      });

      // Continue into the store
      if (onAuthenticated) {
        onAuthenticated(activeCustomer);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback: proceed with minimal customer object
      const fallbackCustomer = {
        name: trimmedName,
        phone: phone,
        saved_address: '',
        city: '',
        state: '',
        pincode: ''
      };
      localStorage.setItem('speedo_customer', JSON.stringify(fallbackCustomer));
      if (onAuthenticated) {
        onAuthenticated(fallbackCustomer);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background Origami Subtle Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#FF6B6B_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black border border-white/20 shadow-origami overflow-hidden">
            <img 
              src="/logo.jpg" 
              alt="Speedo Fashions Logo" 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display font-black text-xl tracking-tighter text-white">SPEEDO</span>
              <span className="text-[#FF6B6B] font-black text-xl tracking-tighter">FASHIONS</span>
            </div>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-wider sm:tracking-widest text-gray-400 font-mono mt-0.5 whitespace-nowrap">
              Beyond Fashion, Beyond Limits
            </p>
          </div>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-8">
        <div className="bg-[#FAFAFA] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-origami-bold p-8 sm:p-10 relative">
          
          {/* Top Geometric Accent */}
          <div className="absolute -top-3 left-8 bg-[#FF6B6B] text-white text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 shadow-sm">
            EXCLUSIVE MEMBER ACCESS
          </div>

          <div className="mb-6 pt-2">
            <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-[#1A1A1A]">
              Enter Speedo Fashions
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Full Name Field */}
            <div>
              <label 
                htmlFor="fullName"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-800 mb-1"
              >
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Siddharth Verma"
                  className={`w-full pl-9 pr-3.5 py-3 text-sm bg-white border ${
                    nameError ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300'
                  } focus:outline-none focus:border-[#1A1A1A] font-sans`}
                />
              </div>
              {nameError && (
                <p className="mt-1 text-xs text-red-600 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{nameError}</span>
                </p>
              )}
            </div>

            {/* Mobile Number Field with +91 Prefix */}
            <div>
              <label 
                htmlFor="mobilePhone"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-800 mb-1"
              >
                Mobile Number *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3.5 text-xs font-mono font-bold bg-gray-100 border border-r-0 border-gray-300 text-gray-700 select-none">
                  +91
                </span>
                <input
                  id="mobilePhone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  className={`w-full px-3.5 py-3 text-sm bg-white border ${
                    phoneError ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300'
                  } focus:outline-none focus:border-[#1A1A1A] font-mono font-bold tracking-wider`}
                />
              </div>
              {phoneError && (
                <p className="mt-1.5 text-xs text-red-600 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{phoneError}</span>
                </p>
              )}
            </div>

            {/* Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full py-4 bg-[#1A1A1A] hover:bg-[#FF6B6B] text-white font-bold text-xs uppercase tracking-wider clip-origami-btn shadow-origami transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1A1A1A]"
              >
                <span>{isSubmitting ? 'Logging in...' : 'Login'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-4 text-center text-xs font-mono text-gray-500">
        SPEEDO FASHIONS ORIGAMI GEOMÉTRICO
      </footer>

    </div>
  );
}
