import { jsPDF } from "jspdf";

/**
 * Generates an Itinerary PDF and returns it as a Buffer.
 * @param {Object} booking - The Booking data.
 * @param {Object} quote - Optional QuoteProposal data for detailed itinerary.
 * @returns {Buffer} - The PDF buffer.
 */
export const generateItineraryPdfBuffer = (booking, quote = {}) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 30;

  // Header / Branding
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("TRAVEL ITINERARY", margin, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Booking Ref: ${String(booking._id || "").substring(0, 8).toUpperCase()}`, margin, y);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, y);

  y += 20;
  
  // Traveler Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("TRAVELER DETAILS", margin, y);
  
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${booking.name || "Guest"}`, margin, y);
  y += 5;
  doc.text(`Phone: ${booking.phone || "N/A"}`, margin, y);
  y += 5;
  doc.text(`Email: ${booking.email || "N/A"}`, margin, y);
  
  // Trip Summary
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 10, pageWidth - margin, y + 10);
  
  y += 25;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOUR PACKAGE", margin, y);
  doc.text("TRAVEL DATE", margin + 80, y);
  doc.text("GUESTS", margin + 140, y);
  
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(booking.packageTour || "Custom Adventure", margin, y);
  doc.text(booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : "To be confirmed", margin + 80, y);
  doc.text(`${booking.pax || 1} Person(s)`, margin + 140, y);

  y += 20;

  // Itinerary Outline (from Quote if available)
  const itinerary = quote.itineraryOutline || [];
  if (itinerary.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DAILY SCHEDULE", margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    itinerary.forEach((day, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`Day ${index + 1}:`, margin, y);
      doc.setFont("helvetica", "normal");
      const splitDay = doc.splitTextToSize(day, pageWidth - margin * 2 - 20);
      doc.text(splitDay, margin + 20, y);
      y += (splitDay.length * 5) + 5;
    });
  } else {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ITINERARY STATUS", margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Your detailed day-by-day itinerary is being finalized by our operations team.", margin, y);
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 285, { align: "center" });
    doc.text("Safe travels with MAZ Expeditions", margin, 285);
  }

  return Buffer.from(doc.output("arraybuffer"));
};
