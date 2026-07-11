/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  User, 
  Trash2,
  Calendar,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Fee, FeeType, PaymentMethod } from '../types';

interface FeesViewProps {
  fees: Fee[];
  clients: Client[];
  onAddFee: (fe: Omit<Fee, 'id' | 'balance_due'>) => Promise<Fee>;
  onUpdateFee: (id: string, fe: Partial<Fee>) => Promise<Fee>;
  onDeleteFee: (id: string) => Promise<boolean>;
  onSelectClient: (clientId: string) => void;
  initialSearchTerm?: string;
}

export default function FeesView({
  fees,
  clients,
  onAddFee,
  onUpdateFee,
  onDeleteFee,
  onSelectClient,
  initialSearchTerm
}: FeesViewProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');

  useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [formClientId, setFormClientId] = useState('');
  const [formType, setFormType] = useState<FeeType>('Per-Return');
  const [formAmount, setFormAmount] = useState<number>(15000);
  const [formPaid, setFormPaid] = useState<number>(0);
  const [formDueDate, setFormDueDate] = useState('2026-07-31');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('Unpaid');
  const [formError, setFormError] = useState('');

  // Enriched fee list
  const enrichedFees = fees.map(fe => {
    const client = clients.find(c => c.id === fe.client_id);
    return {
      ...fe,
      clientName: client ? client.name : 'Unknown Client',
      clientType: client ? client.client_type : 'Individual'
    };
  });

  // Calculate stats
  const totalBilled = fees.reduce((sum, fe) => sum + fe.amount, 0);
  const totalCollected = fees.reduce((sum, fe) => sum + fe.amount_paid, 0);
  const totalOutstanding = fees.reduce((sum, fe) => sum + fe.balance_due, 0);

  // Filter list
  const filteredFees = enrichedFees.filter(fe => {
    const matchesSearch = fe.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      fe.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fe.payment_method && fe.payment_method.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'All' || fe.fee_type === typeFilter;
    
    let matchesPayment = true;
    if (paymentFilter === 'Paid') {
      matchesPayment = fe.balance_due === 0;
    } else if (paymentFilter === 'Unpaid') {
      matchesPayment = fe.amount_paid === 0;
    } else if (paymentFilter === 'Partial') {
      matchesPayment = fe.amount_paid > 0 && fe.balance_due > 0;
    }

    return matchesSearch && matchesType && matchesPayment;
  });

  const handleCreateFee = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formClientId) {
      setFormError('Please select a taxpayer.');
      return;
    }

    if (formAmount <= 0) {
      setFormError('Amount must be positive.');
      return;
    }

    try {
      await onAddFee({
        client_id: formClientId,
        fee_type: formType,
        amount: Number(formAmount),
        amount_paid: Number(formPaid),
        due_date: formDueDate + 'T23:59:59',
        payment_method: formMethod !== 'Unpaid' ? formMethod : undefined,
        payment_date: formPaid > 0 ? new Date().toISOString() : undefined
      });
      setIsFormOpen(false);
      setFormClientId('');
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    }
  };

  const handleLogPaymentQuick = async (fee: Fee) => {
    const amt = prompt(`Log payment for ${fee.fee_type}.\nRemaining balance: PKR ${fee.balance_due.toLocaleString()}.\nEnter amount received (PKR):`, String(fee.balance_due));
    if (amt !== null) {
      const parsed = Number(amt);
      if (isNaN(parsed) || parsed <= 0) {
        alert('Please enter a valid positive number');
        return;
      }
      if (parsed > fee.balance_due) {
        alert('Entered payment exceeds remaining balance due!');
        return;
      }

      const method = prompt('Select payment method (Cash / Bank Transfer / Cheque):', 'Bank Transfer');
      if (!method) return;

      const finalPaid = fee.amount_paid + parsed;
      await onUpdateFee(fee.id, {
        amount_paid: finalPaid,
        payment_method: method as PaymentMethod,
        payment_date: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Fee Collections</h2>
          <p className="text-sm text-slate-500">Invoice and record consultation payments, return filing charges, and retainers.</p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#10B981] hover:bg-[#0da473] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          Invoice Client
        </button>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Invoiced (This Year)</span>
          <p className="text-2xl font-bold text-[#0F2C5C] mt-1">₨ {totalBilled.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Total revenue generated from professional filings</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Collections</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">₨ {totalCollected.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Cash flow received and acknowledged</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Accounts Receivable</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">₨ {totalOutstanding.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Outstanding balances due from clients</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate-400 my-auto" />
          <input
            type="text"
            placeholder="Search billing records by client name, invoice type, method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C5C]"
          />
        </div>

        {/* Invoice Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Invoices</option>
            <option value="Per-Return">Per-Return Charges</option>
            <option value="Retainer">Corporate Retainers</option>
            <option value="Extra Charge">Extra Notice/Audit Charges</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Payments</option>
            <option value="Paid">Fully Paid</option>
            <option value="Unpaid">Completely Unpaid</option>
            <option value="Partial">Partially Paid</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">Client Taxpayer</th>
                <th className="py-3 px-6">Billing Type</th>
                <th className="py-3 px-6">Invoiced Amount</th>
                <th className="py-3 px-6">Amount Collected</th>
                <th className="py-3 px-6">Outstanding Due</th>
                <th className="py-3 px-6">Due Date</th>
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No billing invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => (
                  <tr 
                    key={fee.id} 
                    className="hover:bg-slate-50/50 cursor-pointer transition-all"
                    onClick={() => onSelectClient(fee.client_id)}
                  >
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-800 text-sm block">{fee.clientName}</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{fee.clientType}</span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700">{fee.fee_type}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-600">₨ {fee.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-6 font-mono text-emerald-600">₨ {fee.amount_paid.toLocaleString()}</td>
                    <td className="py-3.5 px-6">
                      <span className={`font-mono font-bold ${fee.balance_due > 0 ? 'text-amber-600' : 'text-slate-400 font-medium'}`}>
                        ₨ {fee.balance_due.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(fee.due_date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${fee.payment_method ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-800'}`}>
                        {fee.payment_method || 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 items-center">
                        {fee.balance_due > 0 && (
                          <button
                            onClick={() => handleLogPaymentQuick(fee)}
                            className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md hover:bg-emerald-100 transition-all cursor-pointer"
                          >
                            Log Payment
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (confirm('Delete this billing invoice record?')) {
                              await onDeleteFee(fee.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- INVOICE CLIENT MODAL --- */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-0 top-20 mx-auto w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h4 className="font-bold text-slate-900 text-sm">Create Professional Invoice</h4>
                <button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-slate-200 text-slate-400 rounded-md">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFee} className="p-5 space-y-4">
                {formError && (
                  <div className="rounded-lg bg-rose-50 p-3.5 border border-rose-100 text-xs font-semibold text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Taxpayer select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Select Taxpayer Client <span className="text-rose-500">*</span></label>
                  <select
                    value={formClientId}
                    required
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="mt-1 block w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.client_type})</option>
                    ))}
                  </select>
                </div>

                {/* Billing Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Invoice Category</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as FeeType)}
                    className="mt-1 block w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="Per-Return">Per-Return Filing Charge</option>
                    <option value="Retainer">Corporate Retainer</option>
                    <option value="Extra Charge">Extra notice/audit consulting charge</option>
                  </select>
                </div>

                {/* Amount details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Total Charge (PKR) <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Initial Amount Paid (PKR)</label>
                    <input
                      type="number"
                      required
                      value={formPaid}
                      onChange={(e) => setFormPaid(Number(e.target.value))}
                      className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Due Date & Initial Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Due Date</label>
                    <input
                      type="date"
                      required
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Method</label>
                    <select
                      value={formMethod}
                      onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                      className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="Unpaid">Unpaid / Deferred</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="px-4.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all">Invoice Client</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
