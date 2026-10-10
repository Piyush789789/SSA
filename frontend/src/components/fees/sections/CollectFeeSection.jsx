import React, { useState } from 'react';
import { Search, X, Plus, CreditCard, Receipt, CheckCircle2 } from 'lucide-react';
import { http, withQuery } from '@/api/http';
import { useApi } from '@/hooks/useApi';
import { AsyncState, LoadingMessage } from '@/components/common/AsyncState';
import { formatCurrency, formatDate, formatDateTime, initialsOf } from '@/utils';
import { statusBadgeClass } from '@/components/fees/feeHelpers';
import { CollectPaymentModal } from '@/components/fees/CollectPaymentModal';
import { PaymentReceiptModal } from '@/components/fees/PaymentReceiptModal';

/**
 * Find a student, see their dues (GET /fees/students/{id}/summary), collect a payment (POST /fees/payments),
 * bill an extra fee head (POST /fees/dues) and reprint receipts (GET /fees/payments?studentId=).
 */
export const CollectFeeSection = ({
  classes = [],
  meta,
  selectedStudent: externalSelectedStudent,
  onClearExternalStudent,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [localStudent, setLocalStudent] = useState(null);
  const activeStudent = localStudent || externalSelectedStudent || null;

  const query = searchTerm.trim();
  const searchApi = useApi(query.length >= 2 ? withQuery('/students', { q: query, className: classFilter }) : null);
  const searchResults = searchApi.data || [];

  const summary = useApi(activeStudent ? `/fees/students/${activeStudent.id}/summary` : null);
  const payments = useApi(activeStudent ? withQuery('/fees/payments', { studentId: activeStudent.id }) : null);
  const heads = useApi(activeStudent ? '/fees/heads' : null);

  const [collectDue, setCollectDue] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [invoiceBusy, setInvoiceBusy] = useState('');
  const [invoiceError, setInvoiceError] = useState('');

  const handleSelectStudent = (st) => {
    setLocalStudent({ id: st.id, name: st.name, className: st.className, rollNumber: st.rollNumber });
    setSearchTerm('');
    setInvoiceError('');
  };

  const handleClearStudent = () => {
    setLocalStudent(null);
    onClearExternalStudent?.();
  };

  const handlePaid = (payment) => {
    setCollectDue(null);
    setReceipt(payment);
    summary.reload();
    payments.reload();
    onToast?.(`Payment recorded — receipt ${payment.receiptNo}.`);
  };

  const handleAddInvoice = async (feeHead) => {
    setInvoiceBusy(feeHead.id);
    setInvoiceError('');
    try {
      await http.post('/fees/dues', { studentId: activeStudent.id, feeHeadId: feeHead.id });
      summary.reload();
      onToast?.(`Invoice added: ${feeHead.title}`);
    } catch (err) {
      setInvoiceError(err.message);
    } finally {
      setInvoiceBusy('');
    }
  };

  const billedHeadIds = new Set((summary.data?.dues || []).map((d) => d.feeHeadId));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Search & Filter Bar Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Search Student</h2>
            <p className="text-xs text-slate-500">Search by student name, roll number, or student ID to collect fees</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, roll no., student ID... (min 2 chars)"
              className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 transition-all"
            />

            {query.length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 max-h-60 overflow-y-auto custom-scrollbar">
                {searchApi.loading ? (
                  <LoadingMessage text="Searching…" />
                ) : searchApi.error ? (
                  <p className="px-4 py-2 text-xs text-rose-600">{searchApi.error.message}</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-4 py-2 text-xs text-slate-400">No students match “{query}”.</p>
                ) : (
                  searchResults.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectStudent(st)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-orange-50/60 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF6B2C] font-bold text-xs flex items-center justify-center">
                          {initialsOf(st.name)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{st.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Class {st.className} • Roll: {st.rollNumber}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-slate-500 font-semibold">{st.id}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF6B2C] cursor-pointer"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeStudent ? (
        <AsyncState state={summary} loadingText="Loading student fees…">
          {(sum) => (
            <div className="space-y-8 animate-fade-in">
              {/* Active Student Summary Banner */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 relative">
                <button
                  type="button"
                  onClick={handleClearStudent}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Change Student"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#FFF5F0] text-[#FF6B2C] font-extrabold text-xl flex items-center justify-center border border-[#FF6B2C]/20 shadow-inner">
                    {initialsOf(sum.studentName)}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{sum.studentName}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Class {sum.className} · ID: <span className="font-mono font-bold text-slate-700">{sum.studentId}</span>
                      {activeStudent.rollNumber != null && (
                        <>
                          {' '}· Roll: <span className="font-bold text-slate-700">{activeStudent.rollNumber}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-start md:self-auto pr-8">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-semibold block">Total Paid</span>
                    <span className="text-xl font-extrabold text-emerald-600">{formatCurrency(sum.paid)}</span>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-semibold block">Balance</span>
                    <span className="text-xl font-extrabold text-rose-600">{formatCurrency(sum.pending)}</span>
                  </div>
                </div>
              </div>

              {/* Dues Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">Fee Dues</h3>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-6">TITLE</th>
                        <th className="py-3.5 px-6">AMOUNT</th>
                        <th className="py-3.5 px-6">CONCESSION</th>
                        <th className="py-3.5 px-6">PAID</th>
                        <th className="py-3.5 px-6">BALANCE</th>
                        <th className="py-3.5 px-6">DUE DATE</th>
                        <th className="py-3.5 px-6">STATUS</th>
                        <th className="py-3.5 px-6 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sum.dues.length > 0 ? (
                        sum.dues.map((due) => (
                          <tr key={due.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                            <td className="py-4 px-6 font-bold text-slate-900">{due.title}</td>
                            <td className="py-4 px-6 text-slate-700">{formatCurrency(due.amount)}</td>
                            <td className="py-4 px-6 text-slate-500">{due.concession ? `− ${formatCurrency(due.concession)}` : '—'}</td>
                            <td className="py-4 px-6 font-semibold text-emerald-600">{formatCurrency(due.paid)}</td>
                            <td className="py-4 px-6 font-bold text-rose-600">{formatCurrency(due.pending)}</td>
                            <td className="py-4 px-6 text-slate-600">{formatDate(due.dueDate)}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusBadgeClass(due.status)}`}>
                                {due.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {due.pending > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setCollectDue(due)}
                                  className="px-4 py-1.5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                >
                                  Collect
                                </button>
                              ) : (
                                <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Paid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                            No fee dues found for this student.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create New Invoice from Fee Structure */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">Create New Invoice from Fee Structure</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Bill an additional fee head to this student</p>
                  {invoiceError && <p className="text-xs font-semibold text-rose-600 mt-2">{invoiceError}</p>}
                </div>
                <AsyncState state={heads} loadingText="Loading fee heads…">
                  {(list) => (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3.5 px-6">FEE HEAD</th>
                            <th className="py-3.5 px-6">AMOUNT</th>
                            <th className="py-3.5 px-6">FREQUENCY</th>
                            <th className="py-3.5 px-6">DUE DATE</th>
                            <th className="py-3.5 px-6 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {list.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                                No fee heads configured yet.
                              </td>
                            </tr>
                          )}
                          {list.map((fh) => (
                            <tr key={fh.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                              <td className="py-4 px-6 font-bold text-slate-900">{fh.title}</td>
                              <td className="py-4 px-6 text-slate-700">{formatCurrency(fh.amount)}</td>
                              <td className="py-4 px-6">
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-slate-700 border border-orange-100">
                                  {fh.frequency}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-600">{formatDate(fh.dueDate)}</td>
                              <td className="py-4 px-6 text-right">
                                {billedHeadIds.has(fh.id) ? (
                                  <span className="text-slate-400 text-xs italic">Already billed</span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={invoiceBusy === fh.id}
                                    onClick={() => handleAddInvoice(fh)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{invoiceBusy === fh.id ? 'Adding…' : 'Invoice'}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </AsyncState>
              </div>

              {/* Payment History */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">Payment History</h3>
                </div>
                <AsyncState state={payments} loadingText="Loading payments…">
                  {(list) => (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3.5 px-6">RECEIPT NO</th>
                            <th className="py-3.5 px-6">TITLE</th>
                            <th className="py-3.5 px-6">AMOUNT</th>
                            <th className="py-3.5 px-6">MODE</th>
                            <th className="py-3.5 px-6">DATE</th>
                            <th className="py-3.5 px-6 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {list.length > 0 ? (
                            list.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors text-xs font-medium">
                                <td className="py-4 px-6 font-mono text-slate-700 font-bold">{tx.receiptNo}</td>
                                <td className="py-4 px-6 font-semibold text-slate-900">{tx.feeTitle}</td>
                                <td className="py-4 px-6 font-extrabold text-emerald-600">{formatCurrency(tx.amount)}</td>
                                <td className="py-4 px-6 text-slate-600">{tx.paymentMode}</td>
                                <td className="py-4 px-6 text-slate-600">{formatDateTime(tx.paidAt)}</td>
                                <td className="py-4 px-6 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setReceipt(tx)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Receipt</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                                No previous payment receipts recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </AsyncState>
              </div>
            </div>
          )}
        </AsyncState>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium text-xs">
          Select or search for a student above to view pending dues and collect fees.
        </div>
      )}

      <CollectPaymentModal
        isOpen={Boolean(collectDue)}
        feeDue={collectDue}
        paymentModes={meta?.paymentModes}
        onClose={() => setCollectDue(null)}
        onPaid={handlePaid}
      />

      <PaymentReceiptModal isOpen={Boolean(receipt)} transaction={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
};

