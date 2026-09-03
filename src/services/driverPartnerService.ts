import { DriverPartnerApplication } from '../types';
import { siteConfig } from '../config/siteConfig';

const STORAGE_KEY = 'tj_driver_partner_applications';

export function getPartnerApplications(): DriverPartnerApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPartnerApplications();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultPartnerApplications();
  } catch (e) {
    console.warn('Could not read partner applications:', e);
    return getDefaultPartnerApplications();
  }
}

export function savePartnerApplication(
  data: Omit<DriverPartnerApplication, 'id' | 'referenceId' | 'createdAt' | 'status'>
): DriverPartnerApplication {
  const existing = getPartnerApplications();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const referenceId = `TJ-CAB-${randNum}`;
  
  const newApp: DriverPartnerApplication = {
    ...data,
    id: `partner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    referenceId,
    createdAt: new Date().toISOString(),
    status: 'New Inquiry',
  };

  const updated = [newApp, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save partner application to storage:', e);
  }

  return newApp;
}

export function updatePartnerApplicationStatus(
  id: string,
  status: DriverPartnerApplication['status']
): DriverPartnerApplication[] {
  const list = getPartnerApplications();
  const updated = list.map((item) => (item.id === id ? { ...item, status } : item));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not update partner application status:', e);
  }
  return updated;
}

export function formatPartnerWhatsAppMessage(app: DriverPartnerApplication): string {
  const tripNames: Record<string, string> = {
    oneway_expressway: 'One-Way Mysore ⇄ BLR Expressway',
    airport_drops: 'BLR / Mysuru Airport Transfers',
    outstation_tours: 'Outstation Tours (Coorg, Ooty, Wayanad)',
    local_packages: 'Local City Hourly Rentals',
  };

  const categoryLabels: Record<string, string> = {
    sedan: 'Sedan (Dzire / Etios / Aura)',
    ertiga: 'Maruti Ertiga (6-7 Seater)',
    innova: 'Toyota Innova (7-8 Seater)',
    crysta: 'Toyota Innova Crysta',
    tempo: 'Force Tempo Traveller / Minibus',
    other: 'Commercial Cab',
  };

  const formattedTrips = app.preferredTrips
    .map((t) => `• ${tripNames[t] || t}`)
    .join('\n');

  const partnerTypeLabel: Record<string, string> = {
    driver_owner: 'Driver + Vehicle Owner',
    fleet_operator: `Fleet Vendor (${app.fleetSize || 'Multiple'} Cabs)`,
    attached_driver: 'Commercial Attached Driver',
    vendor: 'Travel Agent / Vendor Desk',
  };

  const insuranceText = app.insuranceDetails?.validityDate
    ? `✅ Valid till ${app.insuranceDetails.validityDate}${app.insuranceDetails.insuranceType ? ` (${app.insuranceDetails.insuranceType})` : ''}`
    : app.documentsReady.rcAndInsurance
    ? '✅ Valid'
    : '⏳ Pending';

  const fitnessText = app.fitnessDetails?.validityDate
    ? `✅ Valid FC till ${app.fitnessDetails.validityDate}`
    : app.documentsReady.vehicleFitness
    ? '✅ Valid'
    : '⏳ Pending';

  const carImageText = app.carImage
    ? '📸 Car Photo Attached in Submission'
    : '📸 Car Photo to be shared';

  return `*🚖 TRAVEL JUST - DRIVER PARTNER / CAB ATTACHMENT INQUIRY*

Namaskara TRAVEL JUST Team, I wish to attach my commercial vehicle / partner with your cab network in Karnataka:

*PARTNER DETAILS:*
• Reference ID: *${app.referenceId}*
• Name: *${app.fullName}*
• Phone: *${app.mobileNumber}*${app.alternatePhone ? ` (Alt: ${app.alternatePhone})` : ''}
• Operating Base: *${app.city}*
• Partner Role: *${partnerTypeLabel[app.partnerType] || app.partnerType}*

*VEHICLE SPECIFICATION:*
• Vehicle: *${app.vehicleModel}* (${app.manufacturingYear || '2023'})
• Plate: *${app.registrationNumber.toUpperCase()}* (Yellow Board)
• Category: *${categoryLabels[app.vehicleCategory] || app.vehicleCategory.toUpperCase()}*
• Fuel & AC: *${app.fuelType.toUpperCase()}* | *${app.hasAC ? 'Working AC' : 'Non-AC'}*
• Commercial Permit: *${app.permitType.replace(/_/g, ' ').toUpperCase()}*

*DOCUMENT & VEHICLE STATUS:*
• Commercial DL / Badge: ${app.documentsReady.commercialDL ? '✅ Ready' : '⏳ Pending'}
• Insurance: ${insuranceText}
• Fitness Certificate (FC): ${fitnessText}
• Police Verification: ${app.documentsReady.policeVerification ? '✅ Verified' : '⏳ In Process'}
• Vehicle Photo: ${carImageText}

*PREFERRED ROUTES:*
${formattedTrips || '• Outstation & Airport Transfers'}
${app.additionalNotes ? `\n*NOTE / EXPERIENCE:* ${app.additionalNotes}` : ''}

Please review my vehicle details and contact me for driver onboarding & tariff agreement. Thank you!`;
}

function getDefaultPartnerApplications(): DriverPartnerApplication[] {
  return [
    {
      id: 'partner_sample_1',
      referenceId: 'TJ-CAB-4821',
      fullName: 'Manjunath Swamy',
      mobileNumber: '+91 98450 78123',
      city: 'Mysuru',
      partnerType: 'driver_owner',
      vehicleModel: 'Toyota Innova Crysta 2.4 VX',
      vehicleCategory: 'crysta',
      registrationNumber: 'KA-09-C-7744',
      manufacturingYear: '2023',
      fuelType: 'diesel',
      hasAC: true,
      permitType: 'aitp_all_india',
      preferredTrips: ['airport_drops', 'outstation_tours'],
      insuranceDetails: {
        isInsured: true,
        validityDate: '2027-04',
        insuranceType: 'comprehensive',
        docName: 'Commercial_Insurance_Policy.pdf',
      },
      fitnessDetails: {
        isFitnessValid: true,
        validityDate: '2028-03',
        docName: 'Fitness_Certificate_KA09.pdf',
      },
      carImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
      documentsReady: {
        commercialDL: true,
        rcAndInsurance: true,
        vehicleFitness: true,
        policeVerification: true,
      },
      additionalNotes: '10 years experience on Bangalore-Mysore expressway and Coorg hills. Tourist friendly.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'Verified',
    },
    {
      id: 'partner_sample_2',
      referenceId: 'TJ-CAB-5192',
      fullName: 'Sunil Kumar Shetty',
      mobileNumber: '+91 94812 34567',
      city: 'Bengaluru',
      partnerType: 'fleet_operator',
      fleetSize: '4 Cabs (2 Dzire, 2 Ertiga)',
      vehicleModel: 'Maruti Suzuki Ertiga ZXi CNG',
      vehicleCategory: 'ertiga',
      registrationNumber: 'KA-04-E-9912',
      manufacturingYear: '2024',
      fuelType: 'cng',
      hasAC: true,
      permitType: 'karnataka_state',
      preferredTrips: ['oneway_expressway', 'airport_drops'],
      insuranceDetails: {
        isInsured: true,
        validityDate: '2026-11',
        insuranceType: 'comprehensive',
      },
      fitnessDetails: {
        isFitnessValid: true,
        validityDate: '2027-08',
      },
      carImage: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80',
      documentsReady: {
        commercialDL: true,
        rcAndInsurance: true,
        vehicleFitness: true,
        policeVerification: true,
      },
      additionalNotes: 'Available 24/7 for KIAL Airport pickups and one-way drops to Mysore.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'Under Review',
    },
  ];
}
