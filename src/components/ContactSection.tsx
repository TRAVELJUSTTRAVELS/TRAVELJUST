import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

interface ContactSectionProps {
  onOpenBookingSearch?: () => void;
  onApplyBookingPlan?: (plan: any) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceRequired: 'Local Travel',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          name: '',
          phone: '',
          email: '',
          serviceRequired: 'Local Travel',
          message: '',
        });
      }, 500);
    }
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Get In Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Contact Support & Dispatch Desk
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-2">
            Connect directly with our 24/7 Mysuru dispatch desk, or send us your customized travel requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Configurable Contact Information Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
              <h3 className="text-xl font-bold border-b border-emerald-800 pb-4">
                Direct Contact Lines
              </h3>

              <div className="space-y-5 text-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-800 text-emerald-300 rounded-xl shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">
                      Phone Support
                    </span>
                    <a
                      href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`}
                      className="font-extrabold text-white text-base mt-0.5 block hover:underline"
                    >
                      {siteConfig.contact.phone}
                    </a>
                    <span className="text-[11px] text-emerald-200">
                      24/7 Helpline for Instant Bookings
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-800 text-emerald-300 rounded-xl shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">
                      WhatsApp Dispatch
                    </span>
                    <a
                      href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-extrabold text-white text-base mt-0.5 block hover:underline"
                    >
                      {siteConfig.contact.whatsapp}
                    </a>
                    <span className="text-[11px] text-emerald-200">
                      Instant Messaging & Itinerary Updates
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-800 text-emerald-300 rounded-xl shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">
                      Email Enquiries
                    </span>
                    <a
                      href={`mailto:${siteConfig.contact.email}`}
                      className="font-extrabold text-white text-base mt-0.5 block hover:underline break-all"
                    >
                      {siteConfig.contact.email}
                    </a>
                    <span className="text-[11px] text-emerald-200">
                      Corporate Accounts & Written Quotes
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 pt-2 border-t border-emerald-800">
                  <div className="p-3 bg-emerald-800 text-emerald-300 rounded-xl shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">
                      Business Hours
                    </span>
                    <span className="font-semibold text-emerald-100 text-xs mt-0.5 block">
                      {siteConfig.contact.businessHours}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Policies Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 text-xs text-slate-600 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Frequently Clarified Policies:</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-slate-600 pl-1">
                <li><strong className="text-slate-800">Free Cancellation:</strong> Up to 4 hours before scheduled pickup</li>
                <li><strong className="text-slate-800">Transparent Fares:</strong> Fuel and car rental included, tolls at actuals</li>
                <li><strong className="text-slate-800">Fleet Coverage:</strong> Sedans, Ertiga MUVs, and Innova Crystas</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Custom Enquiry Form */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Enquiry Received</h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      Thank you for reaching out to TRAVEL JUST. Our team will respond to your message shortly.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-emerald-900 transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900">Send an Enquiry</h3>
                      <span className="text-xs text-slate-500">For corporate accounts & custom itineraries</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                          errors.name ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter contact phone"
                          className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                            errors.phone ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter email address"
                          className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                            errors.email ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Service Required
                      </label>
                      <select
                        value={formData.serviceRequired}
                        onChange={(e) => setFormData({ ...formData, serviceRequired: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="Local Travel">Local Travel Package</option>
                        <option value="One Way Drop">One Way Drop</option>
                        <option value="Round Trip">Round Trip Journey</option>
                        <option value="Airport Transfer">Airport Transfer</option>
                        <option value="Corporate Fleet Account">Corporate Fleet Account</option>
                        <option value="Other Enquiries">Other Enquiries</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Message
                      </label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Provide details about your travel dates, specific requirements, or questions..."
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit Enquiry
                    </button>
                  </form>
                )}
              </div>
          </div>
        </div>
      </div>
    </section>
  );
};

