/**
 * SSA SHIV SHANTI ADARSH ACADEMY — Student ERP
 * Centralized Fee Management Mock Data & Utilities
 */

export const INITIAL_FEE_HEADS = [
  {
    id: 1,
    title: 'Tuition Fee — Quarter 1 (2026-27)',
    amount: 4500,
    frequency: 'Quarterly',
    dueDate: '2026-04-21',
    academicYear: '2026-27',
    classIds: ['1-A', '1-B', '2-A', '2-B', '10-A', '10-B'],
  },
  {
    id: 2,
    title: 'Tuition Fee — Quarter 2 (2026-27)',
    amount: 4500,
    frequency: 'Quarterly',
    dueDate: '2026-07-22',
    academicYear: '2026-27',
    classIds: ['1-A', '1-B', '2-A', '2-B', '10-A', '10-B'],
  },
  {
    id: 3,
    title: 'Admission & Development Fee (2026-27)',
    amount: 3200,
    frequency: 'One-Time',
    dueDate: '2026-03-30',
    academicYear: '2026-27',
    classIds: ['1-A', '1-B', '2-A', '2-B', '10-A', '10-B'],
  },
  {
    id: 4,
    title: 'Examination Fee — Half Yearly',
    amount: 800,
    frequency: 'One-Time',
    dueDate: '2026-08-31',
    academicYear: '2026-27',
    classIds: ['1-A', '1-B', '2-A', '2-B', '10-A', '10-B'],
  },
];

export const INITIAL_STUDENT_FEE_DUES = [
  {
    id: 101,
    studentId: 1, // Ayesha Abbasi
    feeHeadId: 3,
    title: 'Admission & Development Fee (2026-27)',
    total: 3200,
    paid: 3200,
    dueDate: '2026-03-30',
  },
  {
    id: 102,
    studentId: 1,
    feeHeadId: 1,
    title: 'Tuition Fee — Quarter 1 (2026-27)',
    total: 4500,
    paid: 2100,
    dueDate: '2026-04-21',
  },
  {
    id: 103,
    studentId: 1,
    feeHeadId: 2,
    title: 'Tuition Fee — Quarter 2 (2026-27)',
    total: 4500,
    paid: 0,
    dueDate: '2026-07-22',
  },
  {
    id: 104,
    studentId: 1,
    feeHeadId: 4,
    title: 'Examination Fee — Half Yearly',
    total: 800,
    paid: 0,
    dueDate: '2026-08-31',
  },

  {
    id: 105,
    studentId: 2, // Aditi Sharma
    feeHeadId: 3,
    title: 'Admission & Development Fee (2026-27)',
    total: 3200,
    paid: 3200,
    dueDate: '2026-03-30',
  },
  {
    id: 106,
    studentId: 2,
    feeHeadId: 1,
    title: 'Tuition Fee — Quarter 1 (2026-27)',
    total: 4500,
    paid: 4500,
    dueDate: '2026-04-21',
  },
  {
    id: 107,
    studentId: 2,
    feeHeadId: 2,
    title: 'Tuition Fee — Quarter 2 (2026-27)',
    total: 4500,
    paid: 4500,
    dueDate: '2026-07-22',
  },
  {
    id: 108,
    studentId: 2,
    feeHeadId: 4,
    title: 'Examination Fee — Half Yearly',
    total: 800,
    paid: 0,
    dueDate: '2026-08-31',
  },

  {
    id: 109,
    studentId: 3, // Iqra Saifi
    feeHeadId: 1,
    title: 'Tuition Fee — Quarter 1 (2026-27)',
    total: 4500,
    paid: 4500,
    dueDate: '2026-04-21',
  },
  {
    id: 110,
    studentId: 3,
    feeHeadId: 2,
    title: 'Tuition Fee — Quarter 2 (2026-27)',
    total: 4500,
    paid: 3200,
    dueDate: '2026-07-22',
  },
  {
    id: 111,
    studentId: 3,
    feeHeadId: 4,
    title: 'Examination Fee — Half Yearly',
    total: 800,
    paid: 0,
    dueDate: '2026-08-31',
  },

  {
    id: 112,
    studentId: 4, // Anas Kashyap
    feeHeadId: 3,
    title: 'Admission & Development Fee (2026-27)',
    total: 3200,
    paid: 3200,
    dueDate: '2026-03-30',
  },
  {
    id: 113,
    studentId: 4,
    feeHeadId: 1,
    title: 'Tuition Fee — Quarter 1 (2026-27)',
    total: 4500,
    paid: 4500,
    dueDate: '2026-04-21',
  },
  {
    id: 114,
    studentId: 4,
    feeHeadId: 2,
    title: 'Tuition Fee — Quarter 2 (2026-27)',
    total: 4500,
    paid: 4500,
    dueDate: '2026-07-22',
  },
  {
    id: 115,
    studentId: 4,
    feeHeadId: 4,
    title: 'Examination Fee — Half Yearly',
    total: 800,
    paid: 0,
    dueDate: '2026-08-31',
  },

  {
    id: 116,
    studentId: 5, // Kabir Jain
    feeHeadId: 3,
    title: 'Admission & Development Fee (2026-27)',
    total: 3200,
    paid: 3200,
    dueDate: '2026-03-30',
  },
  {
    id: 117,
    studentId: 5,
    feeHeadId: 1,
    title: 'Tuition Fee — Quarter 1 (2026-27)',
    total: 4500,
    paid: 4500,
    dueDate: '2026-04-21',
  },
  {
    id: 118,
    studentId: 5,
    feeHeadId: 2,
    title: 'Tuition Fee — Quarter 2 (2026-27)',
    total: 4500,
    paid: 4500,
    dueDate: '2026-07-22',
  },
  {
    id: 119,
    studentId: 5,
    feeHeadId: 4,
    title: 'Examination Fee — Half Yearly',
    total: 800,
    paid: 0,
    dueDate: '2026-08-31',
  },

  {
    id: 120,
    studentId: 6, // Sanya Farooqui
    feeHeadId: 3,
    title: 'Admission & Development Fee (2026-27)',
    total: 3200,
    paid: 3200,
    dueDate: '2026-03-30',
  },
  {
    id: 121,
    studentId: 6,
    feeHeadId: 1,
    title: 'Tuition Fee — Quarter 1 (2026-27)',
    total: 4500,
    paid: 4500,
    dueDate: '2026-04-21',
  },
  {
    id: 122,
    studentId: 6,
    feeHeadId: 2,
    title: 'Tuition Fee — Quarter 2 (2026-27)',
    total: 4500,
    paid: 4500,
    dueDate: '2026-07-22',
  },
  {
    id: 123,
    studentId: 6,
    feeHeadId: 4,
    title: 'Examination Fee — Half Yearly',
    total: 800,
    paid: 800,
    dueDate: '2026-08-31',
  },
];

// Today's date YYYY-MM-DD
const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_TRANSACTIONS = [
  {
    id: 201,
    receiptNo: 'RCP-SCH-2026-0004-00400',
    studentId: 2,
    studentName: 'Aditi Sharma',
    className: '1-B',
    rollNo: 1,
    feeHead: 'Admission & Development Fee (2026-27)',
    amount: 3200,
    paymentMode: 'Cheque',
    date: '2026-03-30',
    time: '11:15 AM',
    remarks: 'Cheque No. 441092',
    status: 'Paid',
  },
  {
    id: 202,
    receiptNo: 'RCP-SCH-2026-0004-00401',
    studentId: 2,
    studentName: 'Aditi Sharma',
    className: '1-B',
    rollNo: 1,
    feeHead: 'Tuition Fee — Quarter 1 (2026-27)',
    amount: 4500,
    paymentMode: 'Cash',
    date: '2026-04-21',
    time: '02:30 PM',
    remarks: 'Cash counter deposit',
    status: 'Paid',
  },
  {
    id: 203,
    receiptNo: 'RCP-SCH-2026-0004-00402',
    studentId: 2,
    studentName: 'Aditi Sharma',
    className: '1-B',
    rollNo: 1,
    feeHead: 'Tuition Fee — Quarter 2 (2026-27)',
    amount: 4500,
    paymentMode: 'DD',
    date: '2026-07-22',
    time: '10:45 AM',
    remarks: 'DD #88214',
    status: 'Paid',
  },
  {
    id: 204,
    receiptNo: `RCP-SCH-2026-0004-00403`,
    studentId: 6,
    studentName: 'Sanya Farooqui',
    className: '1-B',
    rollNo: 3,
    feeHead: 'Examination Fee — Half Yearly',
    amount: 800,
    paymentMode: 'Cash',
    date: todayStr,
    time: '09:20 AM',
    remarks: 'Paid at fee window',
    status: 'Paid',
  },
];

export const INITIAL_CONCESSIONS = [
  {
    id: 1,
    studentId: 5,
    studentName: 'Kabir Jain',
    className: '1-A',
    feeStructure: 'Tuition Fee — Quarter 1 (2026-27)',
    type: 'Merit',
    discountType: 'Percentage',
    discountValue: 25,
    grossAmount: 4500,
    effectiveAmount: 3375,
    description: 'Merit concession approved for 2026-27.',
  },
  {
    id: 2,
    studentId: 1,
    studentName: 'Ayesha Abbasi',
    className: '1-A',
    feeStructure: 'Tuition Fee — Quarter 1 (2026-27)',
    type: 'Sibling',
    discountType: 'Percentage',
    discountValue: 10,
    grossAmount: 4500,
    effectiveAmount: 4050,
    description: 'Sibling concession approved for 2026-27.',
  },
];

/** Utility Functions */

// Format currency in Indian Rupees
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Calculate effective amount after concession
export const calculateEffectiveAmount = (grossAmount, discountType, discountValue) => {
  const gross = Number(grossAmount) || 0;
  const val = Number(discountValue) || 0;
  if (discountType === 'Percentage') {
    return Math.max(0, gross - (gross * val) / 100);
  }
  return Math.max(0, gross - val);
};

// Calculate status given paid, total, and dueDate
export const calculateFeeStatus = (paid, total, dueDate) => {
  const pending = total - paid;
  if (pending <= 0) return 'Paid';
  if (paid > 0 && pending > 0) return 'Partial';

  if (dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today && pending > 0) return 'Overdue';
  }

  return 'Pending';
};

// Generate Receipt Number
export const generateReceiptNumber = () => {
  const year = new Date().getFullYear();
  const rand1 = Math.floor(1000 + Math.random() * 9000);
  const rand2 = Math.floor(1000 + Math.random() * 9000);
  return `RCP-SCH-${year}-${rand1}-${rand2}`;
};
