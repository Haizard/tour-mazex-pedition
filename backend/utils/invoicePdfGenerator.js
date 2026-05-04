import { jsPDF } from "jspdf";

/**
 * Generates an Invoice PDF and returns it as a Buffer.
 * @param {Object} transaction - The PaymentTransaction data.
 * @param {Object} booking - The linked Booking data.
 * @returns {Buffer} - The PDF buffer.
 */
export const generateInvoicePdfBuffer = (transaction, booking = {}) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 30;

  // Header / Branding
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text("INVOICE", margin, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Invoice #: INV-${String(transaction._id || "").substring(0, 8).toUpperCase()}`, margin, y);
  doc.text(`Date: ${new Date(transaction.paidAt || Date.now()).toLocaleDateString()}`, pageWidth - margin - 40, y);

  y += 20;
  
  // Billing Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("BILLED TO", margin, y);
  
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`${transaction.customerName || booking.name || "Valued Customer"}`, margin, y);
  if (booking.email) {
    y += 5;
    doc.text(booking.email, margin, y);
  }
  
  // Booking Summary
  doc.setDrawColor(241, 245, 249); // Slate 100
  doc.setLineWidth(0.5);
  doc.line(margin, y + 10, pageWidth - margin, y + 10);
  
  y += 25;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SERVICE / TOUR", margin, y);
  doc.text("STATUS", margin + 110, y);
  doc.text("AMOUNT", pageWidth - margin - 30, y);
  
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(booking.packageTour || "Tourism Services", margin, y);
  doc.text(String(transaction.status).toUpperCase(), margin + 110, y);
  doc.text(`${transaction.currency || "USD"} ${Number(transaction.amount || 0).toLocaleString()}`, pageWidth - margin - 30, y);

  y += 20;

  // Totals Section
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL PAID", margin, y);
  doc.text(`${transaction.currency || "USD"} ${Number(transaction.amount || 0).toLocaleString()}`, pageWidth - margin - 40, y);
  
  y += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Payment Provider: ${String(transaction.provider).toUpperCase()}`, margin, y);
  if (transaction.providerReference) {
    y += 5;
    doc.text(`Reference: ${transaction.providerReference}`, margin, y);
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 285, { align: "center" });
    doc.text("Thank you for choosing MAZ Expeditions", margin, 285);
  }

  return Buffer.from(doc.output("arraybuffer"));
};
