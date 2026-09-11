import React, { useState } from 'react';
import {
  User,
  Mail,
  X,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { CustomerUser } from '../types';
import { registerOrLoginCustomer, findCustomerByPhone } from '../services/customerAuthService';
import { siteConfig } from '../config/siteConfig';
import {
  formatCustomerLoginNotificationMessage,
  getWhatsAppUrl,
  openWhatsAppChat,
} from '../utils/whatsapp';

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
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [loginResult, setLoginResult] = useState<{
    customer: CustomerUser;
    isNew: boolean;
    whatsappUrl: string;
    formattedMessage: string;
  } | null>(null);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(val);
    setError(null);
    if (val.length === 10) {
      const existing = findCustomerByPhone(val);
      if (existing) {
        setIsExistingCustomer(true);
        setFullName(existing.fullName);
        if (existing.email) setEmail(existing.email);
      } else {
        setIsExistingCustomer(false);
      }
    } else {
      setIsExistingCustomer(false);
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
    }, 300);
  };

  const finalizeLogin = (name: string, phone: string, emailId?: string) => {
    const cleanPhone = phone.trim();
    const existing = findCustomerByPhone(cleanPhone);
    const isNew = !existing;
    const finalName = name.trim() || (isNew ? 'New Passenger' : 'Valued Passenger');

    // Register or login customer - this automatically triggers WhatsApp notification to Fleet Manager
    const customer = registerOrLoginCustomer(
      finalName,
      cleanPhone,
      emailId?.trim() || undefined,
      { notifyOwner: true, autoOpenWhatsApp: true }
    );

    const formattedMessage = formatCustomerLoginNotificationMessage(customer, {
      isNewRegistration: isNew,
    });
    const fleetManagerPhone = siteConfig.contact.whatsapp;
    const whatsappUrl = getWhatsAppUrl(formattedMessage, fleetManagerPhone);

    setLoginResult({
      customer,
      isNew,
      whatsappUrl,
      formattedMessage,
    });
    setStep('success');

    // Also trigger direct WhatsApp chat window
    try {
      openWhatsAppChat(formattedMessage, fleetManagerPhone);
    } catch (err) {
      console.warn('Auto open WhatsApp window warning:', err);
    }
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
      finalizeLogin(fullName, mobileNumber, email);
    }, 350);
  };

  const handleQuickBypass = () => {
    if (mobileNumber.length !== 10) {
      setError('Please enter a 10-digit mobile number first.');
      return;
    }
    setError(null);
    finalizeLogin(fullName, mobileNumber, email);
  };

  const handleCompleteAndClose = () => {
    if (loginResult && onSuccess) {
      onSuccess(loginResult.customer);
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
        className="relative w-full max-w-[360px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2441] via-slate-900 to-[#009966] text-white px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0">
              {step === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                {step === 'phone'
                  ? isExistingCustomer
                    ? 'Customer Login'
                    : 'Customer Sign In / Register'
                  : step === 'otp'
                  ? 'Verify Mobile OTP'
                  : 'Login Verified & Dispatched'}
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                {step === 'phone'
                  ? 'Access your trips, live cab tracking & invoices'
                  : step === 'otp'
                  ? `OTP code sent to +91 ${mobileNumber}`
                  : 'WhatsApp alert dispatched to Fleet Manager'}
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
        <div className="p-4 sm:p-4.5 space-y-3">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-2.5">
              {/* Phone Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  {mobileNumber.length === 10 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isExistingCustomer
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isExistingCustomer ? '🔑 Existing' : '✨ New'}
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
                    autoFocus
                    required
                    className="w-full pl-12 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-bold text-sm focus:border-[#20A8D8] focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {isExistingCustomer
                    ? 'Welcome back! We found your customer profile.'
                    : 'New customers are registered & notified to Fleet Manager.'}
                </p>
              </div>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    id="customer-auth-name-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-[#20A8D8] focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Email ID (optional)
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    id="customer-auth-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-[#20A8D8] focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* WhatsApp Notification Guarantee Notice */}
              <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg flex items-start gap-2 text-xs text-emerald-900">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-bold block text-[11px] text-emerald-950">Fleet Manager WhatsApp Alert:</span>
                  <span className="text-[10px] text-emerald-800 leading-snug">
                    Login details are dispatched strictly to Fleet Manager (+91 97407 54400) upon sign-in.
                  </span>
                </div>
              </div>

              <div className="pt-1 space-y-1.5">
                <button
                  id="customer-auth-continue-btn"
                  type="submit"
                  disabled={isLoading || mobileNumber.length !== 10}
                  className="w-full py-2.5 bg-[#4D8BF5] hover:bg-[#3b7be8] active:bg-[#2f6cd6] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isExistingCustomer ? 'Verify & Sign In' : 'Continue with Mobile OTP'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleQuickBypass}
                  disabled={mobileNumber.length !== 10}
                  className="w-full py-1 text-[11px] font-bold text-slate-500 hover:text-emerald-800 transition-colors text-center cursor-pointer disabled:opacity-40"
                >
                  Instant 1-Click Sign In (Skip OTP)
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyAndLogin} className="space-y-2.5">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[11px]">Test Demo OTP:</span>{' '}
                  <span className="font-mono font-black text-xs text-emerald-800">1234</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-[11px] text-emerald-700 underline font-semibold cursor-pointer"
                >
                  Change Number
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Enter 4-Digit OTP
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    id="customer-auth-otp-input"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                    placeholder="1234"
                    maxLength={4}
                    autoFocus
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono font-bold text-base tracking-widest text-center focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Notification Guarantee notice */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 text-[10px] text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Dispatches directly to Fleet Manager WhatsApp (+91 97407 54400).
                </span>
              </div>

              <div className="pt-1 space-y-1.5">
                <button
                  id="customer-auth-verify-btn"
                  type="submit"
                  disabled={isLoading || otp.length < 4}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Access Account</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOtp('1234')}
                  className="w-full py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors text-center cursor-pointer"
                >
                  Auto-fill code 1234
                </button>
              </div>
            </form>
          )}

          {step === 'success' && loginResult && (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              {/* Success Notification Alert */}
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>WhatsApp Notification Dispatched!</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-tight">
                  Login details sent strictly to{' '}
                  <strong>Fleet Manager (+91 97407 54400)</strong>.
                </p>
              </div>

              {/* Login Details Summary Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium text-[11px]">Customer Status:</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      loginResult.isNew
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {loginResult.isNew ? '✨ New Registration' : '🔑 Existing Customer'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Customer:</span>
                  <span className="font-bold text-slate-900">{loginResult.customer.fullName}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{loginResult.customer.mobileNumber}</span>
                </div>

                {loginResult.customer.email && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Email:</span>
                    <span className="text-slate-800 truncate max-w-[180px]">{loginResult.customer.email}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                  <span className="text-slate-500 font-medium">Target:</span>
                  <span className="font-bold text-emerald-800">{siteConfig.contact.whatsapp}</span>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="space-y-1.5 pt-0.5">
                <a
                  id="customer-auth-open-whatsapp-btn"
                  href={loginResult.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white" />
                  <span>Open Fleet Manager WhatsApp Chat</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                <button
                  id="customer-auth-continue-to-app-btn"
                  type="button"
                  onClick={handleCompleteAndClose}
                  className="w-full py-2.5 bg-[#0f2441] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to TRAVEL JUST</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick links to Owner / Partner */}
          {step !== 'success' && (
            <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
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
          )}
        </div>
      </div>
    </div>
  );
};
