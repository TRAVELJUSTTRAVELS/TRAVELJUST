import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden relative text-slate-900 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {type === 'privacy' ? (
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            ) : (
              <FileText className="w-6 h-6 text-emerald-300" />
            )}
            <h3 className="text-xl font-bold">
              {type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <p className="font-semibold text-slate-800">
                Effective Date: August 2026 | {siteConfig.businessName}
              </p>

              <h4 className="font-bold text-slate-900 text-base pt-2">1. Information Collection</h4>
              <p>
                When you submit a ride booking request or contact form through {siteConfig.businessName}, we collect personal information such as your full name, mobile telephone number, email address, pickup and drop location details, travel dates, and special journey instructions.
              </p>

              <h4 className="font-bold text-slate-900 text-base pt-2">2. Use of Information</h4>
              <p>
                Information collected is utilized exclusively for dispatch coordination, verifying vehicle availability, confirming fare estimates, communicating booking status via telephone/WhatsApp/email, and delivering your requested ride service.
              </p>

              <h4 className="font-bold text-slate-900 text-base pt-2">3. Data Protection & Confidentiality</h4>
              <p>
                We do not sell, trade, or rent customer personal data to third-party marketing companies. Personal contact information is shared only with verified dispatch managers and assigned drivers strictly for journey fulfillment.
              </p>

              <h4 className="font-bold text-slate-900 text-base pt-2">4. Support & Queries</h4>
              <p>
                If you have questions regarding your data or wish to request data deletion following journey completion, please contact our support team at {siteConfig.contact.email}.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-800">
                Effective Date: August 2026 | {siteConfig.businessName}
              </p>

              <h4 className="font-bold text-slate-900 text-base pt-2">1. Booking Requests & Confirmation</h4>
              <p>
                All online submissions represent booking requests. A ride is confirmed only after our dispatch team reviews route feasibility, verifies vehicle availability, and contacts the customer with a confirmed itinerary and reference number.
              </p>

              <h4 className="font-bold text-slate-900 text-base pt-2">2. Fare Estimates & Final Fare</h4>
              <p>
                Estimated fares displayed during search are calculated using standard base rates, estimated distances, and duration rules. Final payable fare may vary based on actual route taken, unexpected waiting time, additional stops, or extended package hours.
              </p>

              <h4 className="font-bold text-slate-900 text-base pt-2">3. Cancellations & Modifications</h4>
              <p>
                Customers may request booking modifications or cancellations by reaching out to our support team via phone or WhatsApp with their Booking Reference ID prior to vehicle dispatch.
              </p>

              <h4 className="font-bold text-slate-900 text-base pt-2">4. Passenger Responsibilities</h4>
              <p>
                Passengers are expected to adhere to standard vehicle safety guidelines, ensure baggage fits within the specified vehicle luggage capacity, and present themselves at the agreed pickup location at the scheduled time.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
