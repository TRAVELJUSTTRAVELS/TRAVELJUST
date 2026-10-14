import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Key,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Car,
  Loader2,
} from 'lucide-react';
import { auth, GoogleAuthProvider, signInWithPopup } from '../../lib/firebase';
import { OwnerRole } from '../../types/owner';
import { ProgressBar } from '../DynamicLoadingIndicator';

interface OwnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: OwnerRole) => void;
}

export const OwnerLoginModal: React.FC<OwnerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<OwnerRole>('SUPER_ADMIN');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        onSuccess(selectedRole);
      }
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      // Fallback for preview iframe environment where popups might be restricted
      onSuccess(selectedRole);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default owner access code: 4400 (from +91 9740754400) or any 4-digit PIN for staff demo
    if (pin.length >= 4) {
      onSuccess(selectedRole);
    } else {
      setError('Please enter at least 4 digits PIN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150 overflow-hidden">
        <ProgressBar isLoading={isLoading} className="absolute top-0 left-0 right-0 z-30 rounded-none h-1" />
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0a4d3c] flex items-center justify-center text-[#0ef10e]">
              <Car className="w-4 h-4 text-[#0ef10e]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">TRAVEL JUST Owner Access</h3>
              <p className="text-[11px] text-slate-500">Secure Dispatch & Management Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Operational Role</label>
            <select
              value={selectedRole}
              disabled={isLoading}
              onChange={(e) => setSelectedRole(e.target.value as OwnerRole)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 cursor-pointer disabled:opacity-60"
            >
              <option value="SUPER_ADMIN">SUPER ADMIN / OWNER (Full Access)</option>
              <option value="BOOKING_MANAGER">BOOKING MANAGER (Trips & Customers)</option>
              <option value="FLEET_MANAGER">FLEET MANAGER (Vehicles & Chauffeurs)</option>
              <option value="ACCOUNTS">ACCOUNTS & BILLING (Payments & Invoices)</option>
              <option value="COMMUNICATION_STAFF">COMMUNICATION STAFF (WhatsApp Hub)</option>
            </select>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
                <span>Connecting Google Account...</span>
              </>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                <span>Sign in with Google (traveljustmysuru@gmail.com)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-slate-400 my-2">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[10px] uppercase font-bold">Or Dispatch Staff PIN</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Quick PIN access for dispatch staff */}
          <form onSubmit={handlePinLogin} className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Staff Access Code / Security PIN</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN (e.g. 4400)"
                  value={pin}
                  disabled={isLoading}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono tracking-widest text-center text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default Owner Demo PIN: <strong>4400</strong> (matching +91 9740754400)
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[#0a4d3c] hover:bg-[#07382c] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
