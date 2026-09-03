import React, { useState, useRef } from 'react';
import {
  X,
  Car,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  Sparkles,
  MapPin,
  FileCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Send,
  AlertCircle,
  Copy,
  Check,
  Building,
  User,
  Fuel,
  Award,
  Upload,
  Image as ImageIcon,
  Calendar,
  FileText,
  Trash2,
  Eye,
} from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { DriverPartnerApplication } from '../types';
import { savePartnerApplication, formatPartnerWhatsAppMessage } from '../services/driverPartnerService';
import { openWhatsAppChat } from '../utils/whatsapp';

interface DriverPartnerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type VehicleCategoryKey遵 = 'sedan' | 'ertiga' | 'innova' | 'crysta' | 'tempo' | 'other';

const VEHICLE_CATEGORIES = [
  {
    id: 'sedan' as const,
    label: 'Sedan',
    subtitle: 'Dzire / Etios / Aura',
    capacity: '4 Passengers',
    icon: '🚗',
    models: [
      'Maruti Suzuki Swift Dzire',
      'Toyota Etios',
      'Hyundai Aura / Xcent',
      'Tata Tigor',
    ],
  },
  {
    id: 'ertiga' as const,
    label: 'Ertiga',
    subtitle: 'Maruti Ertiga / XL6',
    capacity: '6 Passengers',
    icon: '🚙',
    models: [
      'Maruti Suzuki Ertiga ZXi / VXi',
      'Maruti Suzuki Ertiga CNG',
      'Maruti Suzuki XL6',
      'Kia Carens (6-7 Seater)',
    ],
  },
  {
    id: 'innova' as const,
    label: 'Innova',
    subtitle: 'Toyota Innova Classic / 2.5',
    capacity: '7-8 Passengers',
    icon: '🚐',
    models: [
      'Toyota Innova 2.5 D4D (7 Seater)',
      'Toyota Innova 2.5 D4D (8 Seater)',
      'Toyota Innova GX / VX Classic',
      'Mahindra Marazzo',
    ],
  },
  {
    id: 'crysta' as const,
    label: 'Innova Crysta',
    subtitle: 'Crysta 2.4 / Hycross',
    capacity: '7-8 Passengers (Premium)',
    icon: '👑',
    models: [
      'Toyota Innova Crysta 2.4 VX (7 Seater)',
      'Toyota Innova Crysta 2.4 ZX / GX',
      'Toyota Innova Hycross Hybrid',
      'Toyota Innova Hycross GX (Petrol)',
    ],
  },
  {
    id: 'tempo' as const,
    label: 'Tempo Traveller',
    subtitle: '12 - 20 Seater / Urbania',
    capacity: '12 to 20 Passengers',
    icon: '🚌',
    models: [
      'Force Tempo Traveller (12-14 Seater AC)',
      'Force Tempo Traveller (17-20 Seater AC)',
      'Force Urbania (Luxury 10-14 Seater)',
      'Tata Winger Executive (12-15 Seater)',
    ],
  },
  {
    id: 'other' as const,
    label: 'Other Cab',
    subtitle: 'Custom Commercial Model',
    capacity: 'Custom Fleet',
    icon: '🚖',
    models: ['Other Commercial Vehicle'],
  },
];

export const DriverPartnerDrawer: React.FC<DriverPartnerDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  // Step 1: Partner Information
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [city, setCity] = useState('Mysuru');
  const [customCity, setCustomCity] = useState('');
  const [partnerType, setPartnerType] = useState<DriverPartnerApplication['partnerType']>('driver_owner');
  const [fleetSize, setFleetSize] = useState('');

  // Step 2: Vehicle Specifications
  const [vehicleCategory, setVehicleCategory] = useState<DriverPartnerApplication['vehicleCategory']>('sedan');
  const [vehicleModel, setVehicleModel] = useState('Maruti Suzuki Swift Dzire');
  const [customVehicleModel, setCustomVehicleModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [manufacturingYear, setManufacturingYear] = useState('2023');
  const [fuelType, setFuelType] = useState<DriverPartnerApplication['fuelType']>('diesel');
  const [hasAC, setHasAC] = useState(true);
  const [permitType, setPermitType] = useState<DriverPartnerApplication['permitType']>('aitp_all_india');

  // Step 3: Insurance & Fitness Certificate Details
  const [isInsured, setIsInsured] = useState(true);
  const [insuranceType, setInsuranceType] = useState<'comprehensive' | 'third_party'>('comprehensive');
  const [insuranceValidity, setInsuranceValidity] = useState('2026-12');
  const [insuranceDocName, setInsuranceDocName] = useState<string>('');
  const [insuranceDocDataUrl, setInsuranceDocDataUrl] = useState<string>('');

  const [isFitnessValid, setIsFitnessValid] = useState(true);
  const [fitnessValidity, setFitnessValidity] = useState('2027-06');
  const [fitnessDocName, setFitnessDocName] = useState<string>('');
  const [fitnessDocDataUrl, setFitnessDocDataUrl] = useState<string>('');

  // Step 4: Car Image
  const [carImage, setCarImage] = useState<string>('');
  const [carImageName, setCarImageName] = useState<string>('');

  // Step 5: Preferred Routes & Driver Checklist
  const [preferredTrips, setPreferredTrips] = useState<string[]>([
    'oneway_expressway',
    'airport_drops',
    'outstation_tours',
  ]);
  const [commercialDL, setCommercialDL] = useState(true);
  const [rcAndInsurance, setRcAndInsurance] = useState(true);
  const [vehicleFitness, setVehicleFitness] = useState(true);
  const [policeVerification, setPoliceVerification] = useState(true);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // State management
  const [submittedApp, setSubmittedApp] = useState<DriverPartnerApplication | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Input Refs
  const carImageInputRef拼 = useRef<HTMLInputElement | null>(null);
  const insuranceInputRef = useRef<HTMLInputElement | null>(null);
  const fitnessInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCategorySelect = (catId: DriverPartnerApplication['vehicleCategory']) => {
    setVehicleCategory(catId);
    const catObj = VEHICLE_CATEGORIES.find((c) => c.id === catId);
    if (catObj && catObj.models.length > 0 && catId !== 'other') {
      setVehicleModel(catObj.models[0]);
    } else if (catId === 'other') {
      setVehicleModel('other');
    }
  };

  const handleCarImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPG, PNG, or WEBP) for the car photo.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Car photo must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCarImage(reader.result as string);
      setCarImageName(file.name);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleInsuranceDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file拼 = e.target.files?.[0];
    if (!file拼) return;
    setInsuranceDocName(file拼.name);
    const reader = new FileReader();
    reader.onload = () => {
      setInsuranceDocDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file拼);
  };

  const handleFitnessDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFitnessDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFitnessDocDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleTripSelection = (tripKey: string) => {
    if (preferredTrips.includes(tripKey)) {
      if (preferredTrips.length === 1) return;
      setPreferredTrips(preferredTrips.filter((t) => t !== tripKey));
    } else {
      setPreferredTrips([...preferredTrips, tripKey]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (!fullName.trim() || cleanPhone.length < 10) {
      setErrorMsg('Please enter your full name and a valid 10-digit mobile number.');
      return;
    }

    const regPlate = registrationNumber.trim();
    if (!regPlate) {
      setErrorMsg('Please provide your commercial yellow-board registration number (e.g. KA-09-A-1234).');
      return;
    }

    const finalCity = city === 'other' ? (customCity.trim() || 'Karnataka') : city;
    const finalModel = vehicleModel === 'other' ? (customVehicleModel.trim() || 'Commercial Cab') : vehicleModel;

    setIsSubmitting(true);

    try {
      const app = savePartnerApplication({
        fullName: fullName.trim(),
        mobileNumber: cleanPhone.startsWith('91') && cleanPhone.length === 12 ? `+${cleanPhone}` : `+91 ${cleanPhone.slice(-10)}`,
        alternatePhone: alternatePhone.trim() ? alternatePhone.trim() : undefined,
        city: finalCity,
        partnerType,
        fleetSize: partnerType === 'fleet_operator' ? (fleetSize.trim() || 'Multiple Cabs') : undefined,
        vehicleModel: finalModel,
        vehicleCategory,
        registrationNumber: regPlate.toUpperCase(),
        manufacturingYear,
        fuelType,
        hasAC,
        permitType,
        preferredTrips,
        insuranceDetails: {
          isInsured,
          insuranceType,
          validityDate: insuranceValidity || undefined,
          docName: insuranceDocName || undefined,
          docDataUrl: insuranceDocDataUrl || undefined,
        },
        fitnessDetails: {
          isFitnessValid,
          validityDate: fitnessValidity || undefined,
          docName: fitnessDocName || undefined,
          docDataUrl: fitnessDocDataUrl || undefined,
        },
        carImage: carImage || undefined,
        carImageName: carImageName || undefined,
        documentsReady: {
          commercialDL,
          rcAndInsurance,
          vehicleFitness,
          policeVerification,
        },
        additionalNotes: additionalNotes.trim() || undefined,
      });

      setSubmittedApp(app);
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMsg('Failed to save partner application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!submittedApp) return;
    const message = formatPartnerWhatsAppMessage(submittedApp);
    openWhatsAppChat(message);
  };

  const handleCopyReference = () => {
    if (!submittedApp) return;
    navigator.clipboard.writeText(submittedApp.referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleResetForm = () => {
    setSubmittedApp(null);
    setFullName('');
    setMobileNumber('');
    setAlternatePhone('');
    setRegistrationNumber('');
    setCustomVehicleModel('');
    setCarImage('');
    setCarImageName('');
    setInsuranceDocName('');
    setFitnessDocName('');
    setAdditionalNotes('');
  };

  // Get current models list for select
  const currentCategoryObj = VEHICLE_CATEGORIES.find((c) => c.id === vehicleCategory);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-50 h-full flex flex-col shadow-2xl overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-800/60 text-white shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-full bg-[#0ef10e]/10 blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0ef10e]/20 border border-[#0ef10e]/50 text-[#0ef10e] text-[11px] font-black uppercase tracking-wider">
                <Car className="w-3.5 h-3.5" />
                <span>Driver Partner & Fleet Attachment</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Attach Your Cab</span>
                <span className="text-sm font-semibold text-emerald-300">| Karnataka Fleet</span>
              </h3>
              <p className="text-xs text-emerald-100/80 max-w-md leading-relaxed">
                Join TRAVEL JUST network in Mysuru, Bengaluru & across Karnataka. Regular trips on Bangalore-Mysore Expressway, airport transfers, and outstation tours.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Perks Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-emerald-800/60 text-[11px] text-emerald-200/90 font-medium">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0ef10e]" />
              <span>Zero Sign-up Fee</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#0ef10e]" />
              <span>Fast Payouts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0ef10e]" />
              <span>24/7 Dispatch Desk</span>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {submittedApp ? (
            /* Success & WhatsApp Dispatch Screen */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Application Registered
                  </span>
                  <h4 className="text-2xl font-black text-slate-900 mt-2">
                    Welcome to TRAVEL JUST Network!
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    Your vehicle details and attachment inquiry have been recorded in our dispatch system. Send your details via WhatsApp to complete instant onboarding.
                  </p>
                </div>

                {/* Reference Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between max-w-sm mx-auto">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Partner Reference ID
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-900">
                      {submittedApp.referenceId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReference}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copiedRef ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Vehicle Summary Review Card */}
                <div className="bg-emerald-950 text-white rounded-2xl p-4 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-[#0ef10e]" />
                      <span className="text-xs font-bold uppercase tracking-wide text-emerald-300">
                        Vehicle Specification
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-[#0ef10e] bg-emerald-900 px-2 py-0.5 rounded-md uppercase">
                      {submittedApp.vehicleCategory}
                    </span>
                  </div>

                  {submittedApp.carImage && (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-900 border border-emerald-800 relative">
                      <img
                        src={submittedApp.carImage}
                        alt="Submitted Cab"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                        {submittedApp.registrationNumber}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-400 block">Model & Year</span>
                      <span className="font-bold">{submittedApp.vehicleModel} ({submittedApp.manufacturingYear})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block">Registration (Yellow Board)</span>
                      <span className="font-mono font-extrabold text-amber-300">{submittedApp.registrationNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block">Insurance</span>
                      <span className="font-medium text-emerald-200">
                        {submittedApp.insuranceDetails?.validityDate ? `Valid till ${submittedApp.insuranceDetails.validityDate}` : 'Active'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block">Fitness Certificate</span>
                      <span className="font-medium text-emerald-200">
                        {submittedApp.fitnessDetails?.validityDate ? `FC valid till ${submittedApp.fitnessDetails.validityDate}` : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5 fill-current" />
                    <span>Send Application to WhatsApp Fleet Desk</span>
                  </button>

                  <a
                    href={`tel:${siteConfig.contact.phone.replace(/\s+/g, '')}`}
                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-emerald-700" />
                    <span>Call Fleet Manager ({siteConfig.contact.phone})</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium py-2 underline"
                  >
                    Submit Another Vehicle / Cab
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SECTION 1: Partner Contact Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>1. Partner & Contact Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name (Owner / Driver) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Gowda"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp / Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="98450 12345"
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Base City in Karnataka <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 bg-white transition-all outline-hidden cursor-pointer"
                    >
                      <option value="Mysuru">Mysuru (Headquarters)</option>
                      <option value="Bengaluru">Bengaluru (Bangalore City / Airport)</option>
                      <option value="Mandya">Mandya / Maddur / Srirangapatna</option>
                      <option value="Coorg (Madikeri)">Coorg / Madikeri / Kushalnagar</option>
                      <option value="Hassan">Hassan / Sakleshpur / Belur</option>
                      <option value="Chikkamagaluru">Chikkamagaluru</option>
                      <option value="Mangaluru">Mangaluru / Udupi</option>
                      <option value="Shivamogga">Shivamogga (Shimoga)</option>
                      <option value="Hubballi-Dharwad">Hubballi - Dharwad</option>
                      <option value="Belagavi">Belagavi</option>
                      <option value="other">Other Karnataka City</option>
                    </select>

                    {city === 'other' && (
                      <input
                        type="text"
                        placeholder="Specify your city / town"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-hidden focus:border-emerald-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Partner Attachment Role
                    </label>
                    <select
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value as DriverPartnerApplication['partnerType'])}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 bg-white transition-all outline-hidden cursor-pointer"
                    >
                      <option value="driver_owner">Driver + Owns the Vehicle (Single Cab)</option>
                      <option value="fleet_operator">Fleet Vendor (Multiple Commercial Cabs)</option>
                      <option value="attached_driver">Commercial Driver for Hire</option>
                      <option value="vendor">Travel Agent / Desk Partner</option>
                    </select>

                    {partnerType === 'fleet_operator' && (
                      <input
                        type="text"
                        placeholder="e.g. 4 Cabs (2 Dzire, 1 Ertiga, 1 Crysta)"
                        value={fleetSize}
                        onChange={(e) => setFleetSize(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-hidden focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Vehicle Specifications (Sedan, Ertiga, Innova, Innova Crysta, Tempo Traveller) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-600" />
                    <span>2. Vehicle Specifications</span>
                  </h4>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Yellow Board Only
                  </span>
                </div>

                {/* Vehicle Category Selector (Sedan, Ertiga, Innova, Innova Crysta, Tempo Traveller) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Vehicle Category <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {VEHICLE_CATEGORIES.map((cat) => {
                      const isSelected = vehicleCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xl">{cat.icon}</span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className="text-xs font-black block leading-tight">
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                              {cat.subtitle}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model, Yellow Board Plate & Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Make & Model Variant <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 bg-white transition-all outline-hidden cursor-pointer"
                    >
                      {currentCategoryObj?.models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value="other">Other Make / Model Variant</option>
                    </select>

                    {vehicleModel === 'other' && (
                      <input
                        type="text"
                        placeholder="Type exact model (e.g. Innova 2.5 V / Force Urbania)"
                        value={customVehicleModel}
                        onChange={(e) => setCustomVehicleModel(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-hidden focus:border-emerald-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Yellow Board Registration Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="KA-09-A-1234"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-extrabold font-mono text-slate-900 placeholder:text-slate-400 bg-amber-50/40 uppercase transition-all outline-hidden"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                        Yellow Board
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Manufacturing / Registration Year
                    </label>
                    <select
                      value={manufacturingYear}
                      onChange={(e) => setManufacturingYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-900 bg-white transition-all outline-hidden cursor-pointer"
                    >
                      <option value="2026">2026 (Brand New)</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                      <option value="2019">2019</option>
                      <option value="2018">2018</option>
                      <option value="2017 & Earlier">2017 & Earlier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fuel & Air Conditioning
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value as DriverPartnerApplication['fuelType'])}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 text-xs font-medium text-slate-900 bg-white outline-hidden cursor-pointer"
                      >
                        <option value="diesel">Diesel</option>
                        <option value="cng">CNG + Petrol</option>
                        <option value="petrol">Petrol</option>
                        <option value="electric">Electric (EV)</option>
                      </select>

                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          id="acCheck"
                          checked={hasAC}
                          onChange={(e) => setHasAC(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="acCheck" className="cursor-pointer">
                          Working AC
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Commercial Permit Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          permitType === 'aitp_all_india'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="permit"
                          checked={permitType === 'aitp_all_india'}
                          onChange={() => setPermitType('aitp_all_india')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs">All India Tourist Permit (AITP)</span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          permitType === 'karnataka_state'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="permit"
                          checked={permitType === 'karnataka_state'}
                          onChange={() => setPermitType('karnataka_state')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs">Karnataka State Permit</span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          permitType === 'local_permit'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="permit"
                          checked={permitType === 'local_permit'}
                          onChange={() => setPermitType('local_permit')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs">City Taxi Permit</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Insurance & Fitness Certificate (FC) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>3. Insurance & Fitness Certificate (FC) Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Insurance Box */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Commercial Insurance</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Mandatory
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Insurance Type
                        </label>
                        <select
                          value={insuranceType}
                          onChange={(e) => setInsuranceType(e.target.value as 'comprehensive' | 'third_party')}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                        >
                          <option value="comprehensive">Comprehensive</option>
                          <option value="third_party">Third Party (TP)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">
                          Valid Till (Month/Year)
                        </label>
                        <input
                          type="month"
                          value={insuranceValidity}
                          onChange={(e) => setInsuranceValidity(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    {/* Insurance Doc Upload */}
                    <div>
                      <input
                        type="file"
                        ref={insuranceInputRef}
                        accept="image/*,.pdf"
                        onChange={handleInsuranceDocUpload}
                        className="hidden"
                      />
                      {insuranceDocName ? (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-300 text-xs">
                          <span className="truncate max-w-[180px] font-medium text-emerald-950">
                            📄 {insuranceDocName}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setInsuranceDocName('');
                              setInsuranceDocDataUrl('');
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => insuranceInputRef.current?.click()}
                          className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-emerald-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Upload Insurance Copy (Optional)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fitness Certificate (FC) Box */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span>Fitness Certificate (FC)</span>
                      </span>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                        RTO Valid
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        FC Expiry / Validity (Month/Year)
                      </label>
                      <input
                        type="month"
                        value={fitnessValidity}
                        onChange={(e) => setFitnessValidity(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                      />
                    </div>

                    {/* FC Doc Upload */}
                    <div>
                      <input
                        type="file"
                        ref={fitnessInputRef}
                        accept="image/*,.pdf"
                        onChange={handleFitnessDocUpload}
                        className="hidden"
                      />
                      {fitnessDocName ? (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-blue-300 text-xs">
                          <span className="truncate max-w-[180px] font-medium text-blue-950">
                            📄 {fitnessDocName}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setFitnessDocName('');
                              setFitnessDocDataUrl('');
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fitnessInputRef.current?.click()}
                          className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-blue-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>Upload Fitness Certificate (Optional)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Car Image / Photo Upload */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>4. Car Image / Vehicle Photo</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Front / Side View</span>
                </div>

                <input
                  type="file"
                  ref={carImageInputRef拼}
                  accept="image/*"
                  onChange={handleCarImageUpload}
                  className="hidden"
                />

                {carImage ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-900">
                    <img
                      src={carImage}
                      alt="Car Preview"
                      className="w-full h-44 sm:h-52 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => carImageInputRef拼.current?.click()}
                        className="px-2.5 py-1 bg-black/70 hover:bg-black text-white text-[11px] font-bold rounded-lg backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Change Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCarImage('');
                          setCarImageName('');
                        }}
                        className="p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-emerald-950/85 border border-emerald-600/60 px-3 py-1 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0ef10e]" />
                      <span>{carImageName || 'Car Photo Uploaded'}</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => carImageInputRef拼.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Click to upload your car photo (Front or side angle)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Yellow board number plate visible preferred • Max 5MB (JPG, PNG)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: Preferred Routes & Document Readiness */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>5. Preferred Routes & Document Checklist</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'oneway_expressway', label: 'One-Way Mysore ⇄ Bengaluru Expressway', desc: 'Fast turnaround corridor trips' },
                    { key: 'airport_drops', label: 'BLR Airport & Mysore Airport Transfers', desc: 'Flight arrivals & departures' },
                    { key: 'outstation_tours', label: 'Outstation Circuits (Coorg, Ooty, Wayanad)', desc: 'Multi-day holiday packages' },
                    { key: 'local_packages', label: 'Mysuru City Hourly Rentals (4h/8h/12h)', desc: 'Sightseeing & corporate duties' },
                  ].map((trip) => {
                    const isSelected = preferredTrips.includes(trip.key);
                    return (
                      <button
                        key={trip.key}
                        type="button"
                        onClick={() => toggleTripSelection(trip.key)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-snug">{trip.label}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{trip.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Checklist checkboxes */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={commercialDL}
                      onChange={(e) => setCommercialDL(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Commercial Badge / DL Ready</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rcAndInsurance}
                      onChange={(e) => setRcAndInsurance(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Commercial RC & Active Insurance</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vehicleFitness}
                      onChange={(e) => setVehicleFitness(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Valid Vehicle Fitness (FC) & Permit</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policeVerification}
                      onChange={(e) => setPoliceVerification(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Clean Driving Track / Police Verified</span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Driver Experience & Trip Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 8 years expressway experience, well versed in Kannada, English, Hindi routes to Coorg, Ooty, Chikmagalur."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-all outline-hidden"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0a4d3c] via-emerald-800 to-[#0a4d3c] hover:from-[#07382c] hover:to-[#07382c] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#0ef10e]" />
                  <span>Submit Cab Attachment Application</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zero sign-up fee • Transparent per-km settlements • Direct dispatch</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
