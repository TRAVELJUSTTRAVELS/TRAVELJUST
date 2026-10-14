import { jsPDF } from 'jspdf';
import { DbBookingRecord, BookingRequest } from '../types';

// Convert integer to Indian currency words format
export function numberToWordsINR(amount: number): string {
  const num = Math.round(Math.max(0, amount));
  if (num === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit > 0 ? ' ' + singleDigits[unit] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = '';
    if (hundred > 0) {
      str += `${singleDigits[hundred]} Hundred`;
      if (rest > 0) str += ' and ';
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str;
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertThreeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertThreeDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertThreeDigits(thousand)} Thousand`);
  if (remainder > 0) parts.push(convertThreeDigits(remainder));

  return `${parts.join(' ')} Rupees Only`;
}

export function createTripInvoicePdfDoc(trip: DbBookingRecord) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Total and Fare Calculations
  const totalCalculatedFare = Number(trip.total_estimated_fare || 0);
  const discountAmount = Number(trip.discount_amount || trip.estimated_fare?.discountAmount || 0);
  const grossBeforeDiscount = totalCalculatedFare + discountAmount;
  
  // Base fare (standard 85% of gross before discount)
  const baseFare = trip.base_fare 
    ? Number(trip.base_fare)
    : Math.round(grossBeforeDiscount * 0.82);

  // Tax (GST 5% standard on passenger transport)
  const taxAmount = trip.tax_amount
    ? Number(trip.tax_amount)
    : Math.round(grossBeforeDiscount * 0.05);

  // Driver allowance & highway package inclusions
  const allowanceAndTolls = Math.max(0, grossBeforeDiscount - baseFare - taxAmount);

  // --- 1. BRAND HEADER BAR (TRAVEL JUST) ---
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TRAVEL JUST · CAB RENTAL & CHAUFFEUR SERVICES', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(167, 243, 208); // Emerald 200
  doc.text('Official Booking Summary & Tax Invoice Receipt · Mysuru, Karnataka', margin, 18);

  // Header Right: Reference ID & Issue Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`BOOKING REF: #${trip.reference_id}`, pageWidth - margin, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(209, 250, 229);
  const issuedDate = new Date(trip.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated: ${issuedDate}`, pageWidth - margin, 18, { align: 'right' });

  // Sub-header Company Details Strip
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(0, 28, pageWidth, 9, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(
    'Regd: D.No 44, Double Rd, Saraswathipuram, Mysuru - 570009  |  GSTIN: 29AAACT9812K1Z5  |  SAC: 9964  |  Help: +91 9740754400  |  traveljustmysuru@gmail.com  |  www.traveljust.in',
    margin,
    34
  );

  let y = 42;

  // --- 2. INVOICE META BAR (Booking ID, Status, Service, Date) ---
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, y, contentWidth, 18, 2.5, 2.5, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE NO.', margin + 5, y + 6);
  doc.text('BOOKING STATUS', margin + 46, y + 6);
  doc.text('SERVICE TYPE', margin + 92, y + 6);
  doc.text('SCHEDULED TRAVEL', margin + 138, y + 6);

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.text(`INV-TJ-${trip.reference_id}`, margin + 5, y + 13);

  const statusUpper = (trip.status || 'CONFIRMED').toUpperCase();
  doc.text(statusUpper, margin + 46, y + 13);

  const serviceLabel =
    trip.service_type === 'outstation'
      ? 'Outstation Journey'
      : trip.service_type === 'local'
      ? `Local Rental (${trip.duration_hours || 8} hrs)`
      : trip.service_type === 'airport'
      ? `Airport Transfer (${trip.airport_transfer_type || 'Pickup/Drop'})`
      : trip.service_type?.toUpperCase() || 'CAB SERVICE';
  doc.text(serviceLabel, margin + 92, y + 13);

  const travelTimeStr = `${trip.travel_date || 'N/A'} at ${trip.pickup_time || 'N/A'}`;
  doc.text(travelTimeStr, margin + 138, y + 13);

  y += 23;

  // --- 3. CUSTOMER DETAILS & FLEET/CHAUFFEUR DETAILS (2 COLUMNS) ---
  const colWidth = (contentWidth - 6) / 2;

  // Left Box: Customer Information
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, 38, 2.5, 2.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, colWidth, 7, 2.5, 2.5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('CUSTOMER / PASSENGER INFORMATION', margin + 4, y + 5);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');

  doc.text('Customer Name:', margin + 4, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.full_name || 'Valued Passenger', margin + 28, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Mobile Number:', margin + 4, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.mobile_number || 'N/A', margin + 28, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Email Address:', margin + 4, y + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const safeEmail = trip.email && trip.email.length > 25 ? trip.email.substring(0, 23) + '...' : trip.email || 'traveljustmysuru@gmail.com';
  doc.text(safeEmail, margin + 28, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Passengers:', margin + 4, y + 34);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${trip.passengers_count || 1} Passenger(s)`, margin + 28, y + 34);

  // Right Box: Vehicle & Chauffeur Information
  const rightColX = margin + colWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, y, colWidth, 38, 2.5, 2.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightColX, y, colWidth, 7, 2.5, 2.5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59);
  doc.text('VEHICLE & CHAUFFEUR ASSIGNMENT', rightColX + 4, y + 5);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');

  doc.text('Cab Model:', rightColX + 4, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.vehicle_name || 'Standard Fleet Cab', rightColX + 28, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Vehicle Category:', rightColX + 4, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text((trip.vehicle_category || 'SEDAN / SUV').toUpperCase(), rightColX + 28, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Assigned Driver:', rightColX + 4, y + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.driver_name || 'Assigned before departure', rightColX + 28, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Vehicle Plate No:', rightColX + 4, y + 34);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.driver_vehicle_plate || 'Commercial Taxi Plate', rightColX + 28, y + 34);

  y += 43;

  // --- 4. TRIP SPECIFICS & DISTANCE DETAILS ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 2.5, 2.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 7, 2.5, 2.5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59);
  doc.text('TRIP SPECIFICS, ROUTE & DISTANCE', margin + 4, y + 5);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Pickup Location:', margin + 4, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const splitPickup = doc.splitTextToSize(trip.pickup_location || 'Mysuru Pickup Point', contentWidth - 42);
  doc.text(splitPickup, margin + 35, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Drop / Destination:', margin + 4, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const dropText = trip.drop_location || (trip.service_type === 'local' ? 'Local City Coverage & Return' : 'Designated Destination');
  const splitDrop = doc.splitTextToSize(dropText, contentWidth - 42);
  doc.text(splitDrop, margin + 35, y + 20);

  // Distance & Duration specs
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Trip Distance:', margin + 4, y + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59);
  const distText = trip.estimated_distance_km
    ? `${trip.estimated_distance_km} km (Google Maps Driving Route)`
    : 'Local Package Coverage';
  doc.text(distText, margin + 35, y + 27);

  if (trip.duration_hours) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Package Duration:', margin + 110, y + 27);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${trip.duration_hours} Hours Package`, margin + 140, y + 27);
  }

  y += 37;

  // --- 5. ITEMIZED FARE, TAX/FEES, DISCOUNT & TOTAL CALCULATED PRICE ---
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.roundedRect(margin, y, contentWidth, 7, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ITEM DESCRIPTION', margin + 5, y + 5);
  doc.text('SAC / CODE', margin + 95, y + 5);
  doc.text('QTY / BASIS', margin + 125, y + 5);
  doc.text('AMOUNT (INR)', pageWidth - margin - 5, y + 5, { align: 'right' });

  y += 7;

  // Line 1: Base Ride Fare & Transit Mileage
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${trip.vehicle_name || 'Cab'} Rental & Transit Mileage (${serviceLabel})`, margin + 5, y + 5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('996412', margin + 95, y + 5.5);
  const baseBasis = trip.estimated_distance_km ? `${trip.estimated_distance_km} km` : trip.duration_hours ? `${trip.duration_hours} hrs` : '1 Journey';
  doc.text(baseBasis, margin + 125, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${baseFare.toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 5.5, { align: 'right' });

  y += 8.5;

  // Line 2: Taxes & Statutory Fees (GST @ 5%)
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 8.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Taxes & Statutory Fees (GST @ 5% · CGST 2.5% + SGST 2.5%)', margin + 5, y + 5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('996412', margin + 95, y + 5.5);
  doc.text('GST 5%', margin + 125, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${taxAmount.toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 5.5, { align: 'right' });

  y += 8.5;

  // Line 3: Chauffeur Allowance & Highway Toll Inclusions
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 8.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Chauffeur Allowance, Night Surcharge & Operating Compliance', margin + 5, y + 5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('996412', margin + 95, y + 5.5);
  doc.text('Package', margin + 125, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${allowanceAndTolls.toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 5.5, { align: 'right' });

  y += 8.5;

  // Line 4: Promotional Discount / Voucher Deduction
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 8.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const discountLabel = trip.discount_label ? `Promotional Discount (${trip.discount_label})` : 'Promotional Discount / Voucher';
  doc.text(discountLabel, margin + 5, y + 5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DISCOUNT', margin + 95, y + 5.5);
  doc.text(discountAmount > 0 ? 'Promo Applied' : 'Nil', margin + 125, y + 5.5);
  doc.setFont('helvetica', 'bold');
  if (discountAmount > 0) {
    doc.setTextColor(6, 78, 59); // Emerald 900
    doc.text(`- INR ${discountAmount.toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 5.5, { align: 'right' });
  } else {
    doc.setTextColor(100, 116, 139);
    doc.text('INR 0.00', pageWidth - margin - 5, y + 5.5, { align: 'right' });
  }

  y += 10;

  // Summary / Total Calculated Price Highlight Box
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('TOTAL CALCULATED PRICE (NET PAYABLE):', margin + 6, y + 7);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(4, 120, 87);
  doc.text(`Amount in words: ${numberToWordsINR(totalCalculatedFare)}`, margin + 6, y + 12.5);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59);
  doc.text(`INR ${totalCalculatedFare.toLocaleString('en-IN')}`, pageWidth - margin - 6, y + 10.5, { align: 'right' });

  y += 20;

  // Special Instructions (if present)
  if (trip.special_instructions) {
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.setDrawColor(251, 191, 36); // Amber 400
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14); // Amber 800
    doc.text('SPECIAL INSTRUCTIONS:', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.text(
      trip.special_instructions.length > 95
        ? trip.special_instructions.substring(0, 92) + '...'
        : trip.special_instructions,
      margin + 45,
      y + 4.5
    );

    y += 13;
  }

  // --- 6. FOOTER, POLICY & DIGITAL AUTHORIZATION STAMP ---
  const footerY = pageHeight - 24;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Important Notes: Expressway tolls (FASTag) & Interstate Border Entry Permits billed at actual electronic receipts. 24x7 Customer Helpline: +91 9740754400',
    margin,
    footerY + 4.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59);
  doc.text(
    'DIGITALLY VERIFIED BY TRAVEL JUST OPERATIONS DESK · MYSURU, KARNATAKA · WWW.TRAVELJUST.IN',
    margin,
    footerY + 9
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Ref: #${trip.reference_id} · Generated via Owner Portal`,
    pageWidth - margin,
    footerY + 9,
    { align: 'right' }
  );

  // Return the PDF document and generated filename
  const fileName = `Invoice_${trip.reference_id || 'Booking'}.pdf`;
  return { doc, fileName };
}

export function generateTripInvoicePdf(trip: DbBookingRecord) {
  const { doc, fileName } = createTripInvoicePdfDoc(trip);
  
  // Safe cross-browser download handling
  try {
    doc.save(fileName);
  } catch (err) {
    console.warn('Standard doc.save failed, falling back to Blob URL download:', err);
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    }, 100);
  }

  return { doc, fileName };
}

export const generateInvoicePDF = generateTripInvoicePdf;

export function bookingRequestToDbRecord(b: BookingRequest): DbBookingRecord {
  const totalFare = Number(b.estimatedFare?.totalEstimatedFare || 0);
  const discountAmount = Number(b.estimatedFare?.discountAmount || 0);

  return {
    reference_id: b.referenceId,
    full_name: b.passengerDetails?.fullName || 'Valued Passenger',
    mobile_number: b.passengerDetails?.mobileNumber || '',
    email: b.passengerDetails?.email || 'traveljustmysuru@gmail.com',
    service_type: b.searchDetails?.serviceType || 'Cab Rental',
    pickup_location: b.searchDetails?.pickupLocation || 'Mysuru',
    drop_location: b.searchDetails?.dropLocation || '',
    travel_date: b.searchDetails?.travelDate || '',
    pickup_time: b.searchDetails?.pickupTime || '09:00 AM',
    return_date: (b.searchDetails as any)?.returnDate,
    return_time: (b.searchDetails as any)?.returnTime,
    duration_hours: b.searchDetails?.durationHours,
    estimated_distance_km: b.searchDetails?.distanceKm || b.estimatedFare?.estimatedDistanceKm,
    airport_transfer_type: (b.searchDetails as any)?.airportTransferType,
    passengers_count: b.passengerDetails?.passengersCount || 1,
    vehicle_id: b.selectedVehicle?.id,
    vehicle_name: b.selectedVehicle?.name || 'Cab',
    vehicle_category: b.selectedVehicle?.category || 'Standard',
    special_instructions: b.passengerDetails?.specialInstructions || b.passengerDetails?.specialRequests,
    total_estimated_fare: totalFare,
    base_fare: Number(b.estimatedFare?.baseFareAmount || Math.round((totalFare + discountAmount) * 0.82)),
    discount_amount: discountAmount,
    discount_label: b.estimatedFare?.discountLabel || (discountAmount > 0 ? 'Promo Discount' : undefined),
    tax_amount: Math.round((totalFare + discountAmount) * 0.05),
    toll_amount: Number(b.estimatedFare?.tollEstimate || 0),
    driver_allowance: Number(b.estimatedFare?.driverAllowanceAmount || 0),
    currency: 'INR',
    status: b.status,
    driver_name: b.driverDetails?.driverName,
    driver_phone: b.driverDetails?.driverPhone,
    driver_vehicle_plate: b.driverDetails?.driverVehiclePlate,
    created_at: (b as any).createdAt || (b as any).created_at || new Date().toISOString(),
  };
}

export function generateBookingInvoicePdf(b: BookingRequest) {
  const trip = bookingRequestToDbRecord(b);
  return generateTripInvoicePdf(trip);
}

/**
 * Share invoice directly via the Web Share API (WhatsApp, Email, installed apps)
 * with graceful fallback for devices without file sharing support.
 */
export async function shareBookingInvoice(b: BookingRequest): Promise<{ shared: boolean; method: string }> {
  const trip = bookingRequestToDbRecord(b);
  const { doc, fileName } = createTripInvoicePdfDoc(trip);

  const shareTitle = `Invoice #${b.referenceId} - TRAVEL JUST`;
  const shareText = `Official Trip Invoice for Booking #${b.referenceId} (${b.passengerDetails.fullName} · ${b.searchDetails.pickupLocation} to ${b.searchDetails.dropLocation || 'Local Package'}) · ₹${Number(b.estimatedFare?.totalEstimatedFare || 0).toLocaleString('en-IN')}`;

  try {
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: shareText,
          });
          return { shared: true, method: 'files' };
        } catch (err: any) {
          if (err.name === 'AbortError') {
            return { shared: false, method: 'cancelled' };
          }
          console.warn('Native file share failed, trying text fallback:', err);
        }
      }

      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
        doc.save(fileName);
        return { shared: true, method: 'text_with_download' };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { shared: false, method: 'cancelled' };
        }
        console.warn('Native text share failed:', err);
      }
    }
  } catch (prepErr) {
    console.warn('Error preparing PDF file for sharing:', prepErr);
  }

  // Fallback for browsers without Web Share API:
  doc.save(fileName);
  const cleanPhone = (b.passengerDetails.mobileNumber || '').replace(/\D/g, '').slice(-10);
  const waText = encodeURIComponent(
    `Hello ${b.passengerDetails.fullName}, here is your official TRAVEL JUST booking summary for #${b.referenceId}:\n• Service: ${b.searchDetails.serviceType}\n• Route: ${b.searchDetails.pickupLocation} ➔ ${b.searchDetails.dropLocation || 'Local Package'}\n• Date: ${b.searchDetails.travelDate} at ${b.searchDetails.pickupTime}\n• Total: ₹${Number(b.estimatedFare?.totalEstimatedFare || 0).toLocaleString('en-IN')}\n\nInvoice PDF has been generated and downloaded to your device!`
  );
  const waUrl = cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${waText}`
    : `https://api.whatsapp.com/send?text=${waText}`;
  window.open(waUrl, '_blank');
  return { shared: true, method: 'whatsapp_fallback' };
}
