import jsPDF from 'jspdf';
import { CartItem } from './supabase';

type InvoiceData = {
  orderId: string;
  tableNumber: number;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp?: string;
};

export const generateInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Restaurant name and header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Masala Bites', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });

  // Divider line
  yPosition += 6;
  doc.setDrawColor(0);
  doc.line(15, yPosition, pageWidth - 15, yPosition);

  // Order information
  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('Order Details:', 15, yPosition);

  yPosition += 6;
  doc.setFont(undefined, 'normal');
  doc.text(`Order ID: ${data.orderId}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Table: ${data.tableNumber}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Phone: ${data.customerPhone}`, 15, yPosition);
  yPosition += 5;

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Date & Time: ${currentDate} ${currentTime}`, 15, yPosition);

  // Items section
  yPosition += 8;
  doc.setDrawColor(0);
  doc.line(15, yPosition, pageWidth - 15, yPosition);

  yPosition += 6;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);

  // Table headers
  const colWidths = {
    item: 70,
    qty: 20,
    price: 25,
    amount: 35,
  };

  let xPos = 15;
  doc.text('Item', xPos, yPosition);
  xPos += colWidths.item;
  doc.text('Qty', xPos, yPosition);
  xPos += colWidths.qty;
  doc.text('Price', xPos, yPosition);
  xPos += colWidths.price;
  doc.text('Amount', xPos, yPosition);

  yPosition += 5;
  doc.setDrawColor(200);
  doc.line(15, yPosition, pageWidth - 15, yPosition);

  // Items rows
  yPosition += 5;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);

  data.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    const maxLines = 2;

    xPos = 15;
    const lines = doc.splitTextToSize(item.name, colWidths.item - 2);
    const itemHeight = lines.length > maxLines ? maxLines * 3.5 : 4;

    // Item name
    doc.text(lines.slice(0, maxLines), xPos, yPosition, {
      maxWidth: colWidths.item - 2,
    });

    // Quantity
    xPos += colWidths.item;
    doc.text(item.quantity.toString(), xPos, yPosition);

    // Price per unit
    xPos += colWidths.qty;
    doc.text(`₹${Math.round(item.price)}`, xPos, yPosition);

    // Amount
    xPos += colWidths.price;
    doc.text(`₹${Math.round(itemTotal)}`, xPos, yPosition);

    yPosition += itemHeight;
  });

  // Totals section
  yPosition += 3;
  doc.setDrawColor(0);
  doc.line(15, yPosition, pageWidth - 15, yPosition);

  yPosition += 6;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);

  // Subtotal
  xPos = pageWidth - 50;
  doc.text('Subtotal:', 15, yPosition);
  doc.text(`₹${Math.round(data.subtotal)}`, xPos, yPosition, { align: 'right' });

  // Tax
  yPosition += 5;
  doc.text('Tax (10%):', 15, yPosition);
  doc.text(`₹${Math.round(data.tax)}`, xPos, yPosition, { align: 'right' });

  // Total
  yPosition += 6;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Total:', 15, yPosition);
  doc.text(`₹${Math.round(data.total)}`, xPos, yPosition, { align: 'right' });

  // Payment status
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(34, 197, 94); // Green color
  doc.text('Payment Status: PAID', pageWidth / 2, yPosition, { align: 'center' });

  // Footer
  yPosition = pageHeight - 15;
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Thank you for your order!', pageWidth / 2, yPosition, { align: 'center' });

  // Download PDF
  const fileName = `Invoice_${data.orderId}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};
