import React, { useState } from 'react';
import {
  User,
  Mail,
  X,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Phone,
  RefreshCw,
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
}) => {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(val);
    setError(null);
    if (val.length === 10) {
      const existing = findCustomerByPhone(val);
      if (existing) {
        setIsExistingCustomer(true);
        if (!fullName.trim()) {
          setFullName(existing.fullName);
        }
        if (existing.email && !email.trim()) {
          setEmail(existing.email);
        }
      } else {
        setIsExistingCustomer(false);
      }
    } else {
      setIsExistingCustomer(false);
    }
  };

  const finalizeLogin = (name: string, phone: string, emailId?: string) => {
    const cleanPhone = phone.trim();
    const existing = findCustomerByPhone(cleanPhone);
    const isNew = !existing;
    const finalName = name.trim() || (isNew ? 'Passenger' : 'Valued Passenger');

    const customer = registerOrLoginCustomer(
      finalName,
      cleanPhone,
      emailId?.trim() || undefined,
      { notifyOwner: true, autoOpenWhatsApp: false }
    );

    if (onSuccess) {
      onSuccess(customer);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    setIsLoading(true);

    // Transition to OTP verification step
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      setOtp('1234'); // Pre-fill sample OTP for instant seamless customer testing
      setResendCooldown(30);
    }, 200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
      setError('Please enter the 4-digit verification code.');
      return;
    }
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      finalizeLogin(fullName, mobileNumber, email);
    }, 200);
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setOtp('1234');
    setResendCooldown(30);
    setError(null);
  };

  return (
    <div
      id="customer-auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="customer-auth-modal-card"
        className="relative w-full max-w-[370px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching original card aesthetic */}
        <div className="bg-gradient-to-r from-[#0f2441] via-slate-900 to-[#009966] text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0">
              {step === 'otp' ? <KeyRound className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                {step === 'otp' ? 'Enter OTP Verification' : 'Customer Sign In'}
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                {step === 'otp'
                  ? `OTP sent to +91 ${mobileNumber || 'XXXXXXXXXX'}`
                  : 'Instant access to your rides, invoices & cab tracking'}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              id="customer-auth-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-3">
              {/* 1. NAME */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  FULL NAME <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="customer-auth-name-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 2. MOBILE NUMBER */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    MOBILE NUMBER <span className="text-rose-500">*</span>
                  </label>
                  {mobileNumber.length === 10 && (
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isExistingCustomer
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isExistingCustomer ? '🔑 Existing User' : '✨ New User'}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500 font-bold text-xs select-none">
                    +91
                  </span>
                  <input
                    id="customer-auth-phone-input"
                    type="tel"
                    value={mobileNumber}
                    onChange={handlePhoneChange}
                    placeholder="Enter 10-digit phone"
                    maxLength={10}
                    required
                    className="w-full pl-12 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 3. EMAIL ID (OPTIONAL) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  EMAIL ID <span className="text-slate-400 font-normal text-[10px] lowercase">(optional)</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="customer-auth-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 4. CONTINUE BUTTON */}
              <div className="pt-2">
                <button
                  id="customer-auth-continue-btn"
                  type="submit"
                  disabled={isLoading || mobileNumber.length !== 10 || !fullName.trim()}
                  className="w-full py-2.5 bg-[#4D8BF5] hover:bg-[#3b7be8] active:bg-[#2f6cd6] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-tight">
                Clicking continue will send a 4-digit verification code to your mobile number.
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              {/* Demo OTP Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">
                    Instant Demo OTP
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-emerald-700">Your Code:</span>
                    <span className="font-mono font-black text-sm text-emerald-900 tracking-wider bg-emerald-200/60 px-2 py-0.5 rounded-md">
                      1234
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('details');
                    setError(null);
                  }}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                >
                  Edit Details
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    ENTER 4-DIGIT OTP
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Sent to +91 {mobileNumber}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    id="customer-auth-otp-input"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    maxLength={4}
                    autoFocus
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono font-black text-lg tracking-[0.4em] text-center focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  id="customer-auth-verify-btn"
                  type="submit"
                  disabled={isLoading || otp.length < 4}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify OTP & Sign In</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('details');
                      setError(null);
                    }}
                    className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Phone className="w-3 h-3" /> Change Number
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
