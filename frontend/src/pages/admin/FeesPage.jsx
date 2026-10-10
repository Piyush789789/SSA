import React, { useState } from 'react';
import {
  LayoutDashboard,
  SlidersHorizontal,
  CreditCard,
  FileText,
  Tag,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { studentsData } from '@/data/studentData';
import {
  INITIAL_FEE_HEADS,
  INITIAL_STUDENT_FEE_DUES,
  INITIAL_TRANSACTIONS,
  INITIAL_CONCESSIONS,
  generateReceiptNumber,
} from '@/data/feeData';

import { FeeDashboardSection } from '@/components/fees/sections/FeeDashboardSection';
import { FeeStructureSection } from '@/components/fees/sections/FeeStructureSection';
import { CollectFeeSection } from '@/components/fees/sections/CollectFeeSection';
import { FeeReportsSection } from '@/components/fees/sections/FeeReportsSection';
import { FeeConcessionsSection } from '@/components/fees/sections/FeeConcessionsSection';

import { CollectPaymentModal } from '@/components/fees/CollectPaymentModal';
import { PaymentReceiptModal } from '@/components/fees/PaymentReceiptModal';
import { FeeHeadModal } from '@/components/fees/FeeHeadModal';
import { ConcessionModal } from '@/components/fees/ConcessionModal';
import { DeleteFeeHeadDialog } from '@/components/fees/DeleteFeeHeadDialog';

export const FeesPage = () => {
  const [activeSidebarId, setActiveSidebarId] = useState('fees');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Central State (Synchronized across all tabs)
  const [students, setStudents] = useState(studentsData);
  const [feeHeads, setFeeHeads] = useState(INITIAL_FEE_HEADS);
  const [studentFeeDues, setStudentFeeDues] = useState(INITIAL_STUDENT_FEE_DUES);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [concessions, setConcessions] = useState(INITIAL_CONCESSIONS);

  // Active Module Sub-Nav Tab
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Selected student passed for collection flow
  const [selectedStudentForCollection, setSelectedStudentForCollection] = useState(null);

  // Modal States
  const [collectModalState, setCollectModalState] = useState({ isOpen: false, feeDue: null, student: null });
  const [receiptModalState, setReceiptModalState] = useState({ isOpen: false, transaction: null });
  const [feeHeadModalState, setFeeHeadModalState] = useState({ isOpen: false, feeHeadToEdit: null });
  const [concessionModalState, setConcessionModalState] = useState({ isOpen: false });
  const [deleteFeeHeadState, setDeleteFeeHeadState] = useState({ isOpen: false, feeHead: null });

  // Toast State
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Refresh data handler
  const handleRefresh = () => {
    triggerToast('Fee data refreshed and recalculated.');
  };

  // Navigate to Collect Fee section for a specific student
  const handleSelectStudentForCollection = (student) => {
    setSelectedStudentForCollection(student);
    setActiveTab('Collect Fee');
  };

  // Open Collect Payment Modal
  const handleOpenCollectModal = (due, student) => {
    setCollectModalState({ isOpen: true, feeDue: due, student });
  };

  // Confirm Payment Action
  const handleConfirmPayment = ({ feeDueId, studentId, amount, paymentMode, remarks }) => {
    const studentObj = students.find((s) => s.id === studentId);
    const targetDue = studentFeeDues.find((d) => d.id === feeDueId);

    if (!targetDue || !studentObj) return;

    // 1. Update paid amount on fee due
    setStudentFeeDues((prev) =>
      prev.map((d) => (d.id === feeDueId ? { ...d, paid: d.paid + amount } : d))
    );

    // 2. Create transaction record
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const receiptNo = generateReceiptNumber();

    const newTx = {
      id: Date.now(),
      receiptNo,
      studentId: studentObj.id,
      studentName: studentObj.name,
      className: studentObj.className,
      rollNo: studentObj.rollNumber,
      studentIdStr: studentObj.studentId,
      feeHead: targetDue.title,
      amount,
      paymentMode,
      date: todayStr,
      time: timeStr,
      remarks: remarks || '',
      status: 'Paid',
    };

    setTransactions((prev) => [newTx, ...prev]);

    // 3. Close Collect Modal & Open Receipt Modal
    setCollectModalState({ isOpen: false, feeDue: null, student: null });
    setReceiptModalState({ isOpen: true, transaction: newTx });
    triggerToast('Payment recorded successfully!');
  };

  // Add Fee Invoice for Student
  const handleAddInvoiceForStudent = (studentId, feeHead) => {
    const newInvoice = {
      id: Date.now(),
      studentId,
      feeHeadId: feeHead.id,
      title: feeHead.title,
      total: feeHead.amount,
      paid: 0,
      dueDate: feeHead.dueDate || new Date().toISOString().split('T')[0],
    };

    setStudentFeeDues((prev) => [...prev, newInvoice]);
    triggerToast(`Invoice added: ${feeHead.title}`);
  };

  // Fee Head Handlers (Add / Edit / Delete)
  const handleSaveFeeHead = (feeHeadData) => {
    if (feeHeadData.id) {
      setFeeHeads((prev) =>
        prev.map((f) => (f.id === feeHeadData.id ? { ...f, ...feeHeadData } : f))
      );
      triggerToast('Fee structure updated.');
    } else {
      const newFh = { ...feeHeadData, id: Date.now(), classIds: ['1-A', '1-B', '10-A', '10-B'] };
      setFeeHeads((prev) => [newFh, ...prev]);
      triggerToast('New fee head added.');
    }
    setFeeHeadModalState({ isOpen: false, feeHeadToEdit: null });
  };

  const handleDeleteFeeHead = (feeHeadId) => {
    setFeeHeads((prev) => prev.filter((f) => f.id !== feeHeadId));
    setDeleteFeeHeadState({ isOpen: false, feeHead: null });
    triggerToast('Fee head deleted.');
  };

  // Concession Handlers
  const handleSaveConcession = (concessionData) => {
    setConcessions((prev) => [concessionData, ...prev]);
    setConcessionModalState({ isOpen: false });
    triggerToast('Concession applied successfully.');
  };

  const handleDeleteConcession = (id) => {
    setConcessions((prev) => prev.filter((c) => c.id !== id));
    triggerToast('Concession removed.');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 animate-bounce print:hidden">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Component */}
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Fees Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-16">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Fee Management
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
                Class-wise fee structure, collection & reports
              </p>
            </div>

            {/* Refresh Action Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-2xl shadow-xs transition-all duration-200 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Horizontal Module Navigation Sub-Bar */}
          <div className="bg-[#FFF5F0] p-1.5 rounded-3xl inline-flex flex-wrap gap-1.5 border border-orange-100 shadow-xs">
            {[
              { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'Fee Structure', label: 'Fee Structure', icon: SlidersHorizontal },
              { id: 'Collect Fee', label: 'Collect Fee', icon: CreditCard },
              { id: 'Reports', label: 'Reports', icon: FileText },
              { id: 'Concessions', label: 'Concessions', icon: Tag },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#FF6B2C] shadow-md shadow-[#FF6B2C]/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 stroke-[2.2] ${
                      isActive ? 'text-[#FF6B2C]' : 'text-slate-400'
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Module Content Sections */}
          <div className="mt-4">
            {activeTab === 'Dashboard' && (
              <FeeDashboardSection
                students={students}
                studentFeeDues={studentFeeDues}
                onSelectStudentForCollection={handleSelectStudentForCollection}
              />
            )}

            {activeTab === 'Fee Structure' && (
              <FeeStructureSection
                feeHeads={feeHeads}
                onAddFeeHead={() => setFeeHeadModalState({ isOpen: true, feeHeadToEdit: null })}
                onEditFeeHead={(fh) => setFeeHeadModalState({ isOpen: true, feeHeadToEdit: fh })}
                onDeleteFeeHead={(fh) => setDeleteFeeHeadState({ isOpen: true, feeHead: fh })}
              />
            )}

            {activeTab === 'Collect Fee' && (
              <CollectFeeSection
                students={students}
                studentFeeDues={studentFeeDues}
                feeHeads={feeHeads}
                transactions={transactions}
                selectedStudent={selectedStudentForCollection}
                onClearExternalStudent={() => setSelectedStudentForCollection(null)}
                onOpenCollectModal={handleOpenCollectModal}
                onOpenReceiptModal={(tx) => setReceiptModalState({ isOpen: true, transaction: tx })}
                onAddInvoiceForStudent={handleAddInvoiceForStudent}
              />
            )}

            {activeTab === 'Reports' && (
              <FeeReportsSection
                students={students}
                studentFeeDues={studentFeeDues}
                transactions={transactions}
                onSelectStudentForCollection={handleSelectStudentForCollection}
              />
            )}

            {activeTab === 'Concessions' && (
              <FeeConcessionsSection
                concessions={concessions}
                onAddConcession={() => setConcessionModalState({ isOpen: true })}
                onDeleteConcession={handleDeleteConcession}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODALS & DIALOGS */}
      <CollectPaymentModal
        isOpen={collectModalState.isOpen}
        feeDue={collectModalState.feeDue}
        student={collectModalState.student}
        onClose={() => setCollectModalState({ isOpen: false, feeDue: null, student: null })}
        onConfirm={handleConfirmPayment}
      />

      <PaymentReceiptModal
        isOpen={receiptModalState.isOpen}
        transaction={receiptModalState.transaction}
        onClose={() => setReceiptModalState({ isOpen: false, transaction: null })}
      />

      <FeeHeadModal
        isOpen={feeHeadModalState.isOpen}
        feeHeadToEdit={feeHeadModalState.feeHeadToEdit}
        onClose={() => setFeeHeadModalState({ isOpen: false, feeHeadToEdit: null })}
        onSave={handleSaveFeeHead}
      />

      <ConcessionModal
        isOpen={concessionModalState.isOpen}
        students={students}
        feeHeads={feeHeads}
        onClose={() => setConcessionModalState({ isOpen: false })}
        onSave={handleSaveConcession}
      />

      <DeleteFeeHeadDialog
        isOpen={deleteFeeHeadState.isOpen}
        feeHead={deleteFeeHeadState.feeHead}
        onClose={() => setDeleteFeeHeadState({ isOpen: false, feeHead: null })}
        onConfirm={handleDeleteFeeHead}
      />
    </div>
  );
};

export default FeesPage;
