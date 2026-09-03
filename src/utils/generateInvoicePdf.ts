import { jsPDF } from 'jspdf';
import { DbBookingRecord } from '../components/RecentTripsSection';

export function generateTripInvoicePdf(trip: DbBookingRecord) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // --- BRAND HEADER BAR ---
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CAB RENTAL & CHAUFFEUR SERVICES', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208); // Emerald 200
  doc.text('Official Booking Summary & Tax Invoice Receipt', margin, 20);

  // Reference tag in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF: ${trip.reference_id}`, pageWidth - margin, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229);
  const issuedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated: ${issuedDate}`, pageWidth - margin, 20, { align: 'right' });

  let y = 38;

  // --- INVOICE META BAR ---
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont('helvetica', 'bold');
  doc.text('BOOKING STATUS', margin + 6, y + 8);
  doc.text('SERVICE TYPE', margin + 55, y + 8);
  doc.text('TRAVEL DATE & TIME', margin + 105, y + 8);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');

  // Status with visual color distinction
  const statusUpper = (trip.status || 'CONFIRMED').toUpperCase();
  doc.text(statusUpper, margin + 6, y + 16);

  const serviceLabel =
    trip.service_type === 'outstation'
      ? 'Outstation Journey'
      : trip.service_type === 'local'
      ? `Local Rental (${trip.duration_hours || 8} hrs)`
      : trip.service_type === 'airport'
      ? `Airport Transfer (${trip.airport_transfer_type || 'Pickup/Drop'})`
      : trip.service_type.toUpperCase();
  doc.text(serviceLabel, margin + 55, y + 16);

  const travelTimeStr = `${trip.travel_date || 'N/A'} at ${trip.pickup_time || 'N/A'}`;
  doc.text(travelTimeStr, margin + 105, y + 16);

  y += 30;

  // --- PASSENGER & VEHICLE DETAILS (2 COLUMNS) ---
  const colWidth = (contentWidth - 6) / 2;

  // Left Box: Passenger Information
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, 42, 3, 3, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, colWidth, 8, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('PASSENGER INFORMATION', margin + 4, y + 5.5);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');

  doc.text('Name:', margin + 4, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.full_name || 'N/A', margin + 24, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Phone:', margin + 4, y + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.mobile_number || 'N/A', margin + 24, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Email:', margin + 4, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const safeEmail = trip.email && trip.email.length > 25 ? trip.email.substring(0, 23) + '...' : trip.email || 'N/A';
  doc.text(safeEmail, margin + 24, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Guests:', margin + 4, y + 35);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${trip.passengers_count || 1} Passenger(s)`, margin + 24, y + 35);

  // Right Box: Vehicle & Driver Information
  const rightColX = margin + colWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, y, colWidth, 42, 3, 3, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightColX, y, colWidth, 8, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('VEHICLE & CHAUFFEUR', rightColX + 4, y + 5.5);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');

  doc.text('Cab Model:', rightColX + 4, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.vehicle_name || 'Standard Fleet Cab', rightColX + 26, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Category:', rightColX + 4, y + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text((trip.vehicle_category || 'SEDAN / SUV').toUpperCase(), rightColX + 26, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Driver:', rightColX + 4, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.driver_name || 'Assigned prior to departure', rightColX + 26, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Plate No:', rightColX + 4, y + 35);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(trip.driver_vehicle_plate || 'Commercial Taxi Plate', rightColX + 26, y + 35);

  y += 48;

  // --- ROUTE & ITINERARY DETAILS ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 8, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('ROUTE ITINERARY', margin + 4, y + 5.5);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Pickup Address:', margin + 4, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const splitPickup = doc.splitTextToSize(trip.pickup_location || 'Designated Pickup Location', contentWidth - 40);
  doc.text(splitPickup, margin + 35, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Drop Address:', margin + 4, y + 25);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const dropText = trip.drop_location || (trip.service_type === 'local' ? 'Local City Coverage & Return' : 'Designated Destination');
  const splitDrop = doc.splitTextToSize(dropText, contentWidth - 40);
  doc.text(splitDrop, margin + 35, y + 25);

  y += 40;

  // --- FARE & BILLING BREAKDOWN TABLE ---
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ITEM DESCRIPTION', margin + 6, y + 5.5);
  doc.text('QTY / BASIS', margin + 100, y + 5.5);
  doc.text('AMOUNT (INR)', pageWidth - margin - 6, y + 5.5, { align: 'right' });

  y += 8;

  // Row 1: Base Ride Service
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 10, 'FD');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${trip.vehicle_name || 'Cab'} Booking - ${serviceLabel}`, margin + 6, y + 6.5);

  doc.setTextColor(100, 116, 139);
  const qtyBasis = trip.duration_hours ? `${trip.duration_hours} hrs package` : '1 Trip Route';
  doc.text(qtyBasis, margin + 100, y + 6.5);

  const totalFare = Number(trip.total_estimated_fare || 0);
  const baseFareCalculated = Math.round(totalFare * 0.85);
  const taxesAndTolls = totalFare - baseFareCalculated;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${baseFareCalculated.toLocaleString('en-IN')}`, pageWidth - margin - 6, y + 6.5, { align: 'right' });

  y += 10;

  // Row 2: Driver Allowance, Tolls & GST
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 10, 'FD');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Tolls, State Permits, Chauffeur Allowance & GST', margin + 6, y + 6.5);

  doc.setTextColor(100, 116, 139);
  doc.text('Included Package', margin + 100, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${taxesAndTolls.toLocaleString('en-IN')}`, pageWidth - margin - 6, y + 6.5, { align: 'right' });

  y += 12;

  // Total Summary Highlight Box
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(margin + 80, y, contentWidth - 80, 16, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text('TOTAL AMOUNT PAYABLE / BILLED:', margin + 85, y + 10.5);

  doc.setFontSize(12);
  doc.text(`INR ${totalFare.toLocaleString('en-IN')}`, pageWidth - margin - 6, y + 10.5, { align: 'right' });

  y += 24;

  // Special instructions note if any
  if (trip.special_instructions) {
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.setDrawColor(251, 191, 36); // Amber 400
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14); // Amber 800
    doc.text('SPECIAL INSTRUCTIONS:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(
      trip.special_instructions.length > 90
        ? trip.special_instructions.substring(0, 87) + '...'
        : trip.special_instructions,
      margin + 4,
      y + 9.5
    );

    y += 16;
  }

  // --- FOOTER & TERMS ---
  const footerY = pageHeight - 26;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for choosing our premium cab rental service. For 24x7 support, inquiries, or billing questions:', margin, footerY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Support: +91 9740754400  |  Email: traveljustmysuru@gmail.com  |  Web: www.traveljust.in  |  Official GST Registered', margin, footerY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Booking Ref: ${trip.reference_id} - Generated via Web Booking Engine`, pageWidth - margin, footerY + 10, { align: 'right' });

  // Save the PDF file
  const fileName = `Invoice_${trip.reference_id || 'Booking'}.pdf`;
  doc.save(fileName);
}
