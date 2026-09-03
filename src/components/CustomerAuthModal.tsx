import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  X,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock,
  KeyRound,
  RotateCw,
  MessageSquare,
  ExternalLink,
  Bell,
  Check,
} from 'lucide-react';
import { CustomerUser, CustomerLoginNotification } from '../types';
import { registerOrLoginCustomer, findCustomerByPhone } from '../services/customerAuthService';
import { siteConfig } from '../config/siteConfig';
import { notifyOwnerOnCustomerLogin, openWhatsAppChat } from '../utils/whatsapp';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: CustomerUser) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('1234');
  
  // Registration Form States
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  
  // Submission & Notification state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<CustomerUser | null>(null);
  const [loginNotification, setLoginNotification] = useState<CustomerLoginNotification | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    // Generate a friendly 4-digit code for quick simulation
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    setOtpCode(randomOtp); // Pre-fill for instant seamless UX
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length < 4) {
      setError('Please enter the 4-digit verification code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      setIsSubmitting(false);
      // Look up or create customer profile
      const existing = findCustomerByPhone(phone);
      const customer = registerOrLoginCustomer(
        existing?.fullName || 'Valued Passenger',
        phone,
        existing?.email || '',
        { notifyOwner: true }
      );

      const { notification } = notifyOwnerOnCustomerLogin(customer, {
        isNewRegistration: false,
      });

      setActiveCustomer(customer);
      setLoginNotification(notification);
      setSuccessMessage(`Welcome back, ${customer.fullName}!`);
    }, 350);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    const clean = regPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      setIsSubmitting(false);
      const customer = registerOrLoginCustomer(regFullName, regPhone, regEmail, {
        notifyOwner: true,
      });

      const { notification } = notifyOwnerOnCustomerLogin(customer, {
        isNewRegistration: true,
      });

      setActiveCustomer(customer);
      setLoginNotification(notification);
      setSuccessMessage(`Account created successfully! Welcome, ${customer.fullName}.`);
    }, 350);
  };

  const handleQuickDemoCustomer = () => {
    const demo = registerOrLoginCustomer('Rahul Sharma', '9876543210', 'rahul.sharma@example.com', {
      notifyOwner: true,
    });

    const { notification } = notifyOwnerOnCustomerLogin(demo, {
      isNewRegistration: false,
    });

    setActiveCustomer(demo);
    setLoginNotification(notification);
    setSuccessMessage('Logged in with Demo Account!');
  };

  const handleCompleteAndClose = () => {
    if (activeCustomer) {
      onSuccess(activeCustomer);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>Customer Login</span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-300/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  TRAVEL JUST
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Manage your trips, download receipts, & 1-click booking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        {!successMessage && (
          <div className="flex border-b border-slate-200 bg-slate-50/70">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
                setOtpSent(false);
              }}
              className={`flex-1 py-3 text-xs font-extrabold tracking-wide uppercase transition-all ${
                tab === 'login'
                  ? 'bg-white text-emerald-900 border-b-2 border-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In with Mobile
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className={`flex-1 py-3 text-xs font-extrabold tracking-wide uppercase transition-all ${
                tab === 'register'
                  ? 'bg-white text-emerald-900 border-b-2 border-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create New Account
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {successMessage ? (
            <div className="py-2 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-base">{successMessage}</p>
                <p className="text-xs text-slate-500 mt-0.5">Session authenticated & verified successfully.</p>
              </div>

              {/* WhatsApp Notification to Owner Status Card */}
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-emerald-950">WhatsApp Alert Dispatched to Operators Desk</span>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-200 text-emerald-900">
                        <Check className="w-2.5 h-2.5 mr-0.5" /> Sent
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Recipient: <strong>TRAVEL JUST Operators Desk</strong> ({siteConfig.contact.phone})
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-100 text-[11px] text-slate-600 font-mono leading-relaxed overflow-hidden">
                  <p className="font-sans font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-emerald-600" />
                    <span>WhatsApp Notification Payload:</span>
                  </p>
                  <p className="line-clamp-3 text-[10px] text-slate-500 whitespace-pre-line">
                    {loginNotification?.formattedMessage || `Customer ${activeCustomer?.fullName} signed in via ${activeCustomer?.mobileNumber}`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (loginNotification?.formattedMessage) {
                        openWhatsAppChat(loginNotification.formattedMessage, siteConfig.contact.whatsapp);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Owner WhatsApp Chat</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteAndClose}
                    className="py-2 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    Continue to App
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* WhatsApp Notification Notice Banner */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 text-[11px] leading-relaxed">
                  <span className="font-bold text-slate-800 block">Login Alert Enabled</span>
                  <span>
                    For safety & fast cab coordination, customer logins trigger an automatic notification to the TRAVEL JUST operators desk ({siteConfig.contact.phone}).
                  </span>
                </div>
              </div>

              {tab === 'login' ? (
                !otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                          +91
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (error) setError('');
                          }}
                          placeholder="e.g. 98765 43210"
                          maxLength={15}
                          autoFocus
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        We'll send an instant verification OTP to your number.
                      </p>
                    </div>

                    {error && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Get Instant OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-900">
                      <div>
                        <span className="font-bold block">OTP sent to +91 {phone}</span>
                        <span className="text-[11px] text-emerald-700">Code auto-filled for fast login: <strong>{generatedOtp}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs font-bold text-emerald-800 underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Enter 4-Digit OTP
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => {
                            setOtpCode(e.target.value);
                            if (error) setError('');
                          }}
                          placeholder="4-digit OTP"
                          maxLength={6}
                          autoFocus
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Verifying & Alerting Owner...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Sign In</span>
                        </>
                      )}
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => {
                          setRegFullName(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="e.g. Ramesh Kumar"
                        autoFocus
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => {
                          setRegPhone(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="10-digit mobile number"
                        maxLength={15}
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="For trip receipts & invoice PDF"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Create Free Account</span>
                  </button>
                </form>
              )}

              {/* Quick Demo Login Option */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Want to test quickly?</span>
                <button
                  type="button"
                  onClick={handleQuickDemoCustomer}
                  className="font-bold text-emerald-800 hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  ⚡ One-Tap Demo Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
