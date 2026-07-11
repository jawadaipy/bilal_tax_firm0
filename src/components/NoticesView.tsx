/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { 
  Search, 
  Filter, 
  BellRing, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Notice, NoticeStatus } from '../types';
import { isOverdue } from '../services/db';

interface NoticesViewProps {
  notices: Notice[];
  clients: Client[];
  onAddNotice: (n: Omit<Notice, 'id'>) => Promise<Notice>;
  onUpdateNotice: (id: string, n: Partial<Notice>) => Promise<Notice>;
  onDeleteNotice: (id: string) => Promise<boolean>;
  onSelectClient: (clientId: string) => void;
}

export default function NoticesView({
  notices,
  clients,
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice,
  onSelectClient
}: NoticesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [formClientId, setFormClientId] = useState('');
  const [formType, setFormType] = useState('Section 114(1) (Notice to File Income Tax Return)');
  const [formDeadline, setFormDeadline] = useState('2026-07-25');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Enriched notice list
  const enrichedNotices = notices.map(n => {
    const client = clients.find(c => c.id === n.client_id);
    return {
      ...n,
      clientName: client ? client.name : 'Unknown Taxpayer',
      clientType: client ? client.client_type : 'Individual'
    };
  });

  // Filter list
  const filteredNotices = enrichedNotices.filter(n => {
    const matchesSearch = n.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.notice_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.notes && n.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || n.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateNotice = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formClientId) {
      setFormError('Please select a taxpayer.');
      return;
    }

    try {
      await onAddNotice({
        client_id: formClientId,
        notice_type: formType,
        date_received: new Date().toISOString(),
        response_deadline: formDeadline + 'T23:59:59',
        status: 'Pending',
        notes: formNotes.trim() || undefined
      });
      setIsFormOpen(false);
      setFormClientId('');
      setFormNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    }
  };

  const handleStatusChange = async (id: string, newStatus: NoticeStatus) => {
    await onUpdateNotice(id, { status: newStatus });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">FBR Notices Registry</h2>
          <p className="text-sm text-slate-500">Log, track, and manage official FBR communications, audit summons, and response deadlines.</p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          Log FBR Notice
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate-400 my-auto" />
          <input
            type="text"
            placeholder="Search notices by taxpayer name, FBR section, notes details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C5C]"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Notices</option>
            <option value="Pending">Pending / Unanswered</option>
            <option value="Responded">Responded</option>
            <option value="Closed">Resolved & Closed</option>
          </select>
        </div>
      </div>

      {/* Notices Cards Feed */}
      <div className="space-y-3.5">
        {filteredNotices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
            No official FBR notices received or logged.
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isNoticeOverdue = isOverdue(notice.response_deadline, notice.status) && notice.status === 'Pending';

            return (
              <div
                key={notice.id}
                onClick={() => onSelectClient(notice.client_id)}
                className={`p-5 bg-white border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-5 hover:shadow-md hover:border-slate-300 cursor-pointer transition-all ${
                  isNoticeOverdue 
                    ? 'border-rose-200 bg-rose-50/10 animate-pulse-glow' 
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-1.5 flex-1 pr-4 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-slate-100 text-[#0F2C5C] px-2 py-0.5 rounded-sm">FBR official notice</span>
                    <span className="font-bold text-slate-900 text-sm truncate">{notice.clientName}</span>
                    <span className="text-xs text-slate-400 font-mono">({notice.clientType})</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 tracking-wide pt-1">{notice.notice_type}</h3>
                  
                  {notice.notes && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 max-w-3xl whitespace-pre-wrap">
                      {notice.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono pt-2">
                    <span>Received Date: {new Date(notice.date_received).toLocaleDateString('en-PK')}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Response Deadline: <span className={`font-bold ${isNoticeOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>{new Date(notice.response_deadline).toLocaleDateString('en-PK')}</span>
                    </span>
                    {isNoticeOverdue && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md animate-pulse">LATE NOTICE RESPONSE</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto" onClick={e => e.stopPropagation()}>
                  {/* Status update drop down */}
                  <select
                    value={notice.status}
                    onChange={(e) => handleStatusChange(notice.id, e.target.value as NoticeStatus)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
                  >
                    <option value="Pending">Pending response</option>
                    <option value="Responded">Responded to FBR</option>
                    <option value="Closed">Closed & settled</option>
                  </select>

                  <button
                    onClick={async () => {
                      if (confirm('Remove this official FBR notice record from CRM?')) {
                        await onDeleteNotice(notice.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                    title="Delete Notice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- ADD NOTICE MODAL --- */}
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
                <h4 className="font-bold text-slate-900 text-sm">Log Received FBR Notice</h4>
                <button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-slate-200 text-slate-400 rounded-md">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNotice} className="p-5 space-y-4">
                {formError && (
                  <div className="rounded-lg bg-rose-50 p-3.5 border border-rose-100 text-xs font-semibold text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Taxpayer select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Select Target Taxpayer <span className="text-rose-500">*</span></label>
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

                {/* Notice Type description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Official Notice Type / FBR Section <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    placeholder="e.g. Section 122(5A) summons or Section 177 Audit"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0F2C5C]"
                  />
                </div>

                {/* Response Deadline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Response Deadline Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="mt-1 block w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Notice Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Detailed description of FBR claims / consultation steps</label>
                  <textarea
                    rows={4}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Provide audit claims, under-reporting claims, documents requested by the FBR inspector..."
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="px-4.5 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all">Log Notice</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
