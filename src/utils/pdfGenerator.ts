import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateMilkCollectionPDF = (data: {
  month: string;
  morningMilk: number;
  eveningMilk: number;
  totalMilk: number;
  collections: any[];
}) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Akshaya Dairy - Milk Collection Report', 14, 20);
  
  // Month
  doc.setFontSize(12);
  doc.text(`Month: ${data.month}`, 14, 30);
  
  // Summary
  doc.setFontSize(14);
  doc.text('Summary', 14, 40);
  doc.setFontSize(10);
  doc.text(`Morning Milk: ${data.morningMilk.toFixed(2)} kg`, 14, 50);
  doc.text(`Evening Milk: ${data.eveningMilk.toFixed(2)} kg`, 14, 56);
  doc.text(`Total Milk: ${data.totalMilk.toFixed(2)} kg`, 14, 62);
  
  // Table
  const tableData = data.collections.map((col: any) => [
    new Date(col.collection_date).toLocaleDateString(),
    col.collection_time,
    col.milk_weight,
    col.fat_percentage,
    col.snf_percentage,
    `₹${col.total_amount.toFixed(2)}`,
  ]);
  
  (doc as any).autoTable({
    startY: 70,
    head: [['Date', 'Time', 'Weight (kg)', 'FAT %', 'SNF %', 'Amount']],
    body: tableData,
    theme: 'striped',
  });
  
  doc.save(`milk-collection-${data.month}.pdf`);
};

export const generateCenterReportPDF = (data: {
  centerName: string;
  startDate: string;
  endDate: string;
  collections: any[];
  totals: {
    totalWeight: number;
    totalAmount: number;
    morningWeight: number;
    eveningWeight: number;
  };
}) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Akshaya Dairy - Center Collection Report', 14, 20);
  
  // Details
  doc.setFontSize(12);
  doc.text(`Center: ${data.centerName}`, 14, 35);
  doc.text(`Period: ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}`, 14, 42);
  
  // Summary
  doc.setFontSize(14);
  doc.text('Summary', 14, 52);
  doc.setFontSize(10);
  let yPos = 62;
  doc.text(`Total Weight: ${data.totals.totalWeight.toFixed(2)} kg`, 14, yPos);
  yPos += 7;
  doc.text(`Morning Milk: ${data.totals.morningWeight.toFixed(2)} kg`, 14, yPos);
  yPos += 7;
  doc.text(`Evening Milk: ${data.totals.eveningWeight.toFixed(2)} kg`, 14, yPos);
  yPos += 7;
  doc.text(`Total Amount: ₹${data.totals.totalAmount.toFixed(2)}`, 14, yPos);
  yPos += 10;
  
  // Table
  const tableData = data.collections.map((col: any) => [
    new Date(col.collection_date).toLocaleDateString(),
    col.collection_time,
    col.milk_weight?.toFixed(2) || '0',
    col.fat_percentage || '0',
    col.snf_percentage || '0',
    `₹${col.total_amount?.toFixed(2) || '0'}`,
  ]);
  
  (doc as any).autoTable({
    startY: yPos,
    head: [['Date', 'Time', 'Weight (kg)', 'FAT %', 'SNF %', 'Amount']],
    body: tableData,
    theme: 'striped',
  });
  
  const fileName = data.centerName ? 
    `center-report-${data.centerName}-${data.startDate}-${data.endDate}.pdf` :
    `all-centers-report-${data.startDate}-${data.endDate}.pdf`;
  doc.save(fileName);
};

export const generateDriverPaymentPDF = (data: {
  driverName: string;
  startDate: string;
  endDate: string;
  baseSalary: number;
  overtime: number;
  bonus: number;
  deductions: number;
  finalAmount: number;
  paymentCode?: string;
  collections?: number;
}) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Akshaya Dairy - Driver Payment', 14, 20);
  
  // Details
  doc.setFontSize(12);
  doc.text(`Driver: ${data.driverName}`, 14, 35);
  doc.text(`Period: ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}`, 14, 42);
  if (data.paymentCode) {
    doc.text(`Payment Code: ${data.paymentCode}`, 14, 49);
  }
  
  // Salary breakdown
  doc.setFontSize(14);
  doc.text('Salary Breakdown', 14, 60);
  doc.setFontSize(10);
  
  let yPos = 70;
  doc.text(`Base Salary: ₹${data.baseSalary.toFixed(2)}`, 14, yPos);
  yPos += 7;
  doc.text(`Overtime: ₹${data.overtime.toFixed(2)}`, 14, yPos);
  yPos += 7;
  doc.text(`Bonus: ₹${data.bonus.toFixed(2)}`, 14, yPos);
  yPos += 7;
  doc.text(`Deductions: ₹${data.deductions.toFixed(2)}`, 14, yPos);
  if (data.collections !== undefined) {
    yPos += 7;
    doc.text(`Collections: ${data.collections}`, 14, yPos);
  }
  yPos += 10;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Final Amount: ₹${data.finalAmount.toFixed(2)}`, 14, yPos);
  
  const fileName = data.paymentCode ? 
    `driver-payment-${data.paymentCode}.pdf` :
    `driver-payment-${data.driverName}-${data.startDate}-${data.endDate}.pdf`;
  doc.save(fileName);
};

export const generateCenterPaymentPDF = (data: {
  centerName: string;
  month: string;
  totalMilkAmount: number;
  advanceAmount: number;
  previousPending: number;
  deductions: number;
  finalAmount: number;
  paymentCode: string;
  collections: any[];
}) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Akshaya Dairy - Center Payment', 14, 20);
  
  // Details
  doc.setFontSize(12);
  doc.text(`Center: ${data.centerName}`, 14, 35);
  doc.text(`Month: ${data.month}`, 14, 42);
  doc.text(`Payment Code: ${data.paymentCode}`, 14, 49);
  
  // Payment breakdown
  doc.setFontSize(14);
  doc.text('Payment Breakdown', 14, 60);
  doc.setFontSize(10);
  
  let yPos = 70;
  doc.text(`Total Milk Amount: ₹${data.totalMilkAmount.toFixed(2)}`, 14, yPos);
  yPos += 7;
  doc.text(`Advance: ₹${data.advanceAmount.toFixed(2)}`, 14, yPos);
  yPos += 7;
  doc.text(`Previous Pending: ₹${data.previousPending.toFixed(2)}`, 14, yPos);
  yPos += 7;
  doc.text(`Deductions: ₹${data.deductions.toFixed(2)}`, 14, yPos);
  yPos += 10;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Final Amount: ₹${data.finalAmount.toFixed(2)}`, 14, yPos);
  
  // Collections table if provided
  if (data.collections && data.collections.length > 0) {
    yPos += 15;
    const tableData = data.collections.map((col: any) => [
      new Date(col.collection_date).toLocaleDateString(),
      col.milk_weight?.toFixed(2) || '0',
      `₹${col.total_amount?.toFixed(2) || '0'}`,
    ]);
    
    (doc as any).autoTable({
      startY: yPos,
      head: [['Date', 'Weight (kg)', 'Amount']],
      body: tableData,
      theme: 'striped',
    });
  }
  
  doc.save(`center-payment-${data.centerName}-${data.month}.pdf`);
};
