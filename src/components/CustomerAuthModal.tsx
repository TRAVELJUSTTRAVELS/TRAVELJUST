import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  KeyRound,
} from 'lucide-react';
import { CustomerUser } from '../types';
import { registerOrLoginCustomer, findCustomerByPhone } from '../services/customerAuthService';

export interface CustomerAuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (customer: CustomerUser) => void;
  onOpenOwnerLogin?: () => void;
  onOpenPartnerDrawer?: () => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen = false,
  onClose,
  onSuccess,
  onOpenOwnerLogin,
  onOpenPartnerDrawer,
}) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(val);
    setError(null);
    if (val.length === 10) {
      const existing = findCustomerByPhone(val);
      if (existing) {
        setFullName(existing.fullName);
        if (existing.email) setEmail(existing.email);
      }
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      setOtp('1234'); // Default quick demo OTP
    }, 400);
  };

  const handleVerifyAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
      setError('Please enter the 4-digit verification code.');
      return;
    }
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const customer = registerOrLoginCustomer(
        fullName.trim() || 'Valued Passenger',
        mobileNumber.trim(),
        email.trim() || undefined,
        { notifyOwner: true }
      );
      if (onSuccess) {
        onSuccess(customer);
      }
      if (onClose) {
        onClose();
      }
    }, 400);
  };

  const handleQuickBypass = () => {
    if (mobileNumber.length !== 10) {
      setError('Please enter a 10-digit mobile number first.');
      return;
    }
    const customer = registerOrLoginCustomer(
      fullName.trim() || 'Valued Passenger',
      mobileNumber.trim(),
      email.trim() || undefined,
      { notifyOwner: true }
    );
    if (onSuccess) {
      onSuccess(customer);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      id="customer-auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="customer-auth-modal-card"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2441] via-slate-900 to-[#009966] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {step === 'phone' ? 'Login or Create Account' : 'Verify Mobile OTP'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {step === 'phone'
                  ? 'Access your trips, live cab tracking & invoices'
                  : `OTP code sent to +91 ${mobileNumber}`}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              id="customer-auth-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500 font-bold text-sm select-none">
                    +91
                  </span>
                  <input
                    id="customer-auth-phone-input"
                    type="tel"
                    value={mobileNumber}
                    onChange={handlePhoneChange}
                    placeholder="Enter 10-digit phone"
                    maxLength={10}
                    autoFocus
                    required
                    className="w-full pl-14 pr-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 font-bold text-base focus:border-[#20A8D8] focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  New users will be registered automatically.
                </p>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    id="customer-auth-name-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:border-[#20A8D8] focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Email ID (optional)
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    id="customer-auth-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:border-[#20A8D8] focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  id="customer-auth-continue-btn"
                  type="submit"
                  disabled={isLoading || mobileNumber.length !== 10}
                  className="w-full py-3.5 bg-[#4D8BF5] hover:bg-[#3b7be8] active:bg-[#2f6cd6] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue with Mobile OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleQuickBypass}
                  disabled={mobileNumber.length !== 10}
                  className="w-full py-2 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors text-center cursor-pointer disabled:opacity-40"
                >
                  Instant 1-Click Sign In (Skip OTP)
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndLogin} className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Test Demo OTP:</span>{' '}
                  <span className="font-mono font-black text-sm text-emerald-800">1234</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-emerald-700 underline font-semibold cursor-pointer"
                >
                  Change Number
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Enter 4-Digit OTP
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    id="customer-auth-otp-input"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                    placeholder="1234"
                    maxLength={4}
                    autoFocus
                    required
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 font-mono font-bold text-lg tracking-widest text-center focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  id="customer-auth-verify-btn"
                  type="submit"
                  disabled={isLoading || otp.length < 4}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Access Account</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOtp('1234')}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors text-center cursor-pointer"
                >
                  Auto-fill code 1234
                </button>
              </div>
            </form>
          )}

          {/* Quick links to Owner / Partner */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
            {onOpenPartnerDrawer && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onOpenPartnerDrawer();
                }}
                className="hover:text-emerald-700 font-medium cursor-pointer"
              >
                Attach Cab / Partner
              </button>
            )}
            {onOpenOwnerLogin && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onOpenOwnerLogin();
                }}
                className="hover:text-amber-700 font-medium cursor-pointer"
              >
                Owner Portal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
