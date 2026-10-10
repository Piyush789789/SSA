/**
 * SSA SHIV SHANTI ADARSH ACADEMY — Student ERP
 * Centralized Teacher Communication Mock Data
 */

export const INITIAL_COMMUNICATION_MESSAGES = [
  {
    id: 'MSG-001',
    recipientType: 'Class',
    className: '5-B',
    recipientName: 'Class 5-B Parents',
    subject: 'Math Class Test on Tuesday',
    message: 'Dear parents, please note that a periodic test on Chapter 4 Fractions will be conducted on Tuesday during period 1. Ensure students bring geometry boxes.',
    sentAt: '2026-09-26 10:30 AM',
    status: 'Sent',
    author: 'Anjali Singh',
  },
  {
    id: 'MSG-002',
    recipientType: 'Student',
    className: '6-A',
    recipientName: 'Owais Khan (Father: Arman Khan)',
    subject: 'Science Lab Journal Submission',
    message: 'Dear Mr. Khan, Owais has done an excellent job on his light reflection lab journal. Keep up the high standard!',
    sentAt: '2026-09-25 02:15 PM',
    status: 'Sent',
    author: 'Anjali Singh',
  },
  {
    id: 'MSG-003',
    recipientType: 'Class',
    className: '6-A',
    recipientName: 'Class 6-A Parents',
    subject: 'Science Exhibition Project Materials',
    message: 'Reminder for science project submission details. Groups have been finalized and topic guidelines uploaded to Study Materials.',
    sentAt: '2026-09-23 04:00 PM',
    status: 'Sent',
    author: 'Anjali Singh',
  },
];
