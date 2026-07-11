/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Kanban,
  Table,
  User,
  Calendar,
  Layers,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Filing, FilingType, FilingStatus } from '../types';
import { isOverdue } from '../services/db';

interface FilingsViewProps {
  filings: Filing[];
  clients: Client[];
  onAddFiling: (f: Omit<Filing, 'id'>) => Promise<Filing>;
  onUpdateFiling: (id: string, f: Partial<Filing>) => Promise<Filing>;
  onDeleteFiling: (id: string) => Promise<boolean>;
  onSelectClient: (clientId: string) => void;
  initialSearchTerm?: string;
}

export default function FilingsView({
  filings,
  clients,
  onAddFiling,
  onUpdateFiling,
  onDeleteFiling,
  onSelectClient,
  initialSearchTerm
}: FilingsViewProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');

  useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // New filing form states
  const [formClientId, setFormClientId] = useState('');
  const [formType, setFormType] = useState<FilingType>('Income Tax Return');
  const [formPeriod, setFormPeriod] = useState('Tax Year 2025');
  const [formDeadline, setFormDeadline] = useState('2026-09-30');
  const [formStatus, setFormStatus] = useState<FilingStatus>('Not Started');
  const [formError, setFormError] = useState('');

  // Enriched filings list
  const enrichedFilings = filings.map(f => {
    const client = clients.find(c => c.id === f.client_id);
    return {
      ...f,
      clientName: client ? client.name : 'Unknown Taxpayer',
      clientType: client ? client.client_type : 'Individual'
    };
  });

  // Filter filings
  const filteredFilings = enrichedFilings.filter(f => {
    const matchesSearch = f.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.tax_period.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.iris_ack_number && f.iris_ack_number.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    const matchesType = typeFilter === 'All' || f.filing_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const statuses: FilingStatus[] = ['Not Started', 'Documents Pending', 'In Progress', 'Filed', 'Acknowledged'];

  const getStatusColor = (status: FilingStatus) => {
    switch (status) {
      case 'Not Started': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Documents Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Filed': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Acknowledged': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleCreateFiling = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formClientId) {
      setFormError('Please select a taxpayer.');
      return;
    }

    try {
      await onAddFiling({
        client_id: formClientId,
        filing_type: formType,
        tax_period: formPeriod,
        deadline: formDeadline + 'T23:59:59',
        status: formStatus,
        filed_date: (formStatus === 'Filed' || formStatus === 'Acknowledged') ? new Date().toISOString() : undefined
      });
      setIsFormOpen(false);
      setFormClientId('');
    } catch (err: any) {
      setFormError(err.message || 'Error occurred.');
    }
  };

  const handleApplyFilingTemplate = (template: 'IncomeTax' | 'SalesTax') => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    if (template === 'IncomeTax') {
      setFormType('Income Tax Return');
      setFormPeriod(`Tax Year ${new Date().getFullYear()}`);
      setFormDeadline(`${new Date().getFullYear()}-09-30`);
      setFormStatus('Not Started');
    } else if (template === 'SalesTax') {
      setFormType('Sales Tax Return');
      setFormPeriod(nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      const monthStr = (nextMonth.getMonth() + 1).toString().padStart(2, '0');
      setFormDeadline(`${nextMonth.getFullYear()}-${monthStr}-18`);
      setFormStatus('Not Started');
    }
  };

  const handleStatusChange = async (id: string, newStatus: FilingStatus) => {
    const update: Partial<Filing> = { status: newStatus };
    if (newStatus === 'Filed' || newStatus === 'Acknowledged') {
      update.filed_date = new Date().toISOString();
    }
    await onUpdateFiling(id, update);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Delete this filing record?')) {
      await onDeleteFiling(id);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Return Filings</h2>
          <p className="text-sm text-slate-500">Track and update active income tax, sales tax, and withholding returns.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggles */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex shrink-0">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'board' ? 'bg-white text-[#0F2C5C] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center gap-1 text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-white text-[#0F2C5C] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dense Grid View"
            >
              <Table className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#10B981] hover:bg-[#0da473] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Schedule Filing
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate-400 my-auto" />
          <input
            type="text"
            placeholder="Search filings by taxpayer name, tax year, IRIS ack code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C5C]"
          />
        </div>

        {/* Status Filter (only active in table mode, board already shows status blocks) */}
        {viewMode === 'table' && (
          <div className="w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {/* Return Type Filter */}
        <div className="w-full md:w-48">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Return Types</option>
            <option value="Income Tax Return">Income Tax Return</option>
            <option value="Wealth Statement">Wealth Statement</option>
            <option value="Sales Tax Return">Sales Tax Return</option>
            <option value="Withholding Statement">Withholding Statement</option>
          </select>
        </div>
      </div>

      {/* --- BOARD / KANBAN VIEW --- */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 select-none">
          {statuses.map((status) => {
            const columnFilings = filteredFilings.filter(f => f.status === status);

            return (
              <div key={status} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 min-w-[210px] flex flex-col h-[calc(100vh-270px)]">
                {/* Column Header */}
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{status}</span>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {columnFilings.length}
                  </span>
                </div>

                {/* Column Cards (Vertical stack) */}
                <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                  {columnFilings.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 rounded-lg">
                      Empty column
                    </div>
                  ) : (
                    columnFilings.map((filing) => {
                      const isFilingOverdue = isOverdue(filing.deadline, filing.status);

                      return (
                        <div
                          key={filing.id}
                          className={`bg-white p-3.5 rounded-lg border text-xs shadow-xs hover:shadow-md transition-all relative group cursor-pointer ${
                            isFilingOverdue 
                              ? 'border-rose-200 bg-rose-50/10 hover:border-rose-300 animate-pulse-glow' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => onSelectClient(filing.client_id)}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="font-bold text-slate-800 group-hover:text-[#0F2C5C] truncate block leading-tight">
                              {filing.clientName}
                            </span>
                            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          </div>

                          <span className="text-[10px] font-medium text-slate-500 block">{filing.filing_type}</span>
                          
                          <div className="flex items-center justify-between mt-3 gap-1 flex-wrap">
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm font-semibold">{filing.tax_period}</span>
                            
                            <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                              isFilingOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'
                            }`}>
                              <Clock className="h-3 w-3 shrink-0" />
                              {new Date(filing.deadline).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          {/* Action drop down to move to another status */}
                          <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1" onClick={e => e.stopPropagation()}>
                            <select
                              value={filing.status}
                              onChange={(e) => handleStatusChange(filing.id, e.target.value as FilingStatus)}
                              className="text-[10px] font-semibold border-none bg-slate-50 hover:bg-slate-100 text-slate-500 py-0.5 px-1.5 rounded-sm cursor-pointer focus:ring-0"
                            >
                              {statuses.map(s => <option key={s} value={s}>Move to {s}</option>)}
                            </select>
                            
                            <button
                              onClick={() => handleDeleteClick(filing.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-all cursor-pointer shrink-0"
                              title="Delete Filing"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TABLE VIEW --- */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-6">Taxpayer</th>
                  <th className="py-3 px-6">Return Type</th>
                  <th className="py-3 px-6">Period</th>
                  <th className="py-3 px-6">Deadline Date</th>
                  <th className="py-3 px-6">Status Badge</th>
                  <th className="py-3 px-6">IRIS Acknowledgment</th>
                  <th className="py-3 px-6 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredFilings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No matching filing returns found.
                    </td>
                  </tr>
                ) : (
                  filteredFilings.map((filing) => {
                    const isFilingOverdue = isOverdue(filing.deadline, filing.status);

                    return (
                      <tr 
                        key={filing.id} 
                        className="hover:bg-slate-50/50 cursor-pointer transition-all"
                        onClick={() => onSelectClient(filing.client_id)}
                      >
                        <td className="py-3.5 px-6 font-bold text-slate-800">{filing.clientName}</td>
                        <td className="py-3.5 px-6 text-slate-700">{filing.filing_type}</td>
                        <td className="py-3.5 px-6"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm font-semibold">{filing.tax_period}</span></td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className={isFilingOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                              {new Date(filing.deadline).toLocaleDateString('en-PK')}
                            </span>
                            {isFilingOverdue && (
                              <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1 rounded-sm">OVERDUE</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-6" onClick={e => e.stopPropagation()}>
                          <select
                            value={filing.status}
                            onChange={(e) => handleStatusChange(filing.id, e.target.value as FilingStatus)}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold border border-slate-200 bg-slate-50 cursor-pointer focus:outline-hidden"
                          >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="py-3.5 px-6" onClick={e => e.stopPropagation()}>
                          {filing.status === 'Filed' || filing.status === 'Acknowledged' ? (
                            <input
                              type="text"
                              placeholder="FBR IRIS Receipt No"
                              value={filing.iris_ack_number || ''}
                              onChange={(e) => onUpdateFiling(filing.id, { iris_ack_number: e.target.value })}
                              className="px-2 py-1 border border-slate-200 rounded-md font-mono text-xs max-w-44 focus:ring-1 focus:ring-[#0F2C5C] focus:outline-hidden"
                            />
                          ) : (
                            <span className="text-slate-400">Unfiled</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleDeleteClick(filing.id)}
                            className="p-1 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SCHEDULE FILING MODAL --- */}
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
                <h4 className="font-bold text-slate-900 text-sm">Schedule Return Filing</h4>
                <button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-slate-200 text-slate-400 rounded-md">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFiling} className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2 mb-1 items-center bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                    Templates:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyFilingTemplate('IncomeTax')}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 shadow-xs transition-colors cursor-pointer"
                  >
                    Income Tax Return
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFilingTemplate('SalesTax')}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 shadow-xs transition-colors cursor-pointer"
                  >
                    Sales Tax Return
                  </button>
                </div>

                {formError && (
                  <div className="rounded-lg bg-rose-50 p-3.5 border border-rose-100 text-xs font-semibold text-rose-700 flex items-start gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Taxpayer */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Select Client Taxpayer <span className="text-rose-500">*</span></label>
                  <select
                    value={formClientId}
                    required
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="mt-1 block w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                  >
                    <option value="">-- Choose Taxpayer --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.client_type})</option>
                    ))}
                  </select>
                </div>

                {/* Filing Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Return Category</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as FilingType)}
                    className="mt-1 block w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="Income Tax Return">Income Tax Return</option>
                    <option value="Wealth Statement">Wealth Statement</option>
                    <option value="Sales Tax Return">Sales Tax Return</option>
                    <option value="Withholding Statement">Withholding Statement</option>
                  </select>
                </div>

                {/* Period */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Tax Period / Year</label>
                  <input
                    type="text"
                    required
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    placeholder="e.g. Tax Year 2025"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0F2C5C]"
                  />
                </div>

                {/* Deadline & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Submission Deadline</label>
                    <input
                      type="date"
                      required
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0F2C5C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Workflow Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as FilingStatus)}
                      className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Documents Pending">Documents Pending</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="px-4.5 py-2 bg-[#0F2C5C] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all">Schedule Return</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline X svg component
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
