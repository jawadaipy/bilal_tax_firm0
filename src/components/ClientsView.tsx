/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowLeft, 
  Briefcase, 
  User, 
  Building, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  CreditCard, 
  BellDot, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  X, 
  Activity, 
  Check, 
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Client, 
  Filing, 
  Fee, 
  Document, 
  Notice, 
  ActivityLog, 
  ClientType, 
  ATLStatus, 
  FilingType, 
  FilingStatus,
  FeeType,
  PaymentMethod,
  NoticeStatus
} from '../types';
import { isOverdue } from '../services/db';

interface ClientsViewProps {
  clients: Client[];
  filings: Filing[];
  fees: Fee[];
  documents: Document[];
  notices: Notice[];
  activities: ActivityLog[];
  selectedClientId: string | null;
  onSelectClient: (id: string | null) => void;
  initialSearchTerm?: string;
  
  // CRUD Actions
  onAddClient: (c: Omit<Client, 'id' | 'created_at'>) => Promise<Client>;
  onUpdateClient: (id: string, c: Partial<Client>) => Promise<Client>;
  onDeleteClient: (id: string) => Promise<boolean>;
  
  onAddFiling: (f: Omit<Filing, 'id'>) => Promise<Filing>;
  onUpdateFiling: (id: string, f: Partial<Filing>) => Promise<Filing>;
  onDeleteFiling: (id: string) => Promise<boolean>;

  onAddFee: (fe: Omit<Fee, 'id' | 'balance_due'>) => Promise<Fee>;
  onUpdateFee: (id: string, fe: Partial<Fee>) => Promise<Fee>;
  onDeleteFee: (id: string) => Promise<boolean>;

  onAddDocument: (doc: Omit<Document, 'id' | 'uploaded_at'>) => Promise<Document>;
  onDeleteDocument: (id: string) => Promise<boolean>;

  onAddNotice: (n: Omit<Notice, 'id'>) => Promise<Notice>;
  onUpdateNotice: (id: string, n: Partial<Notice>) => Promise<Notice>;
  onDeleteNotice: (id: string) => Promise<boolean>;
}

export default function ClientsView({
  clients,
  filings,
  fees,
  documents,
  notices,
  activities,
  selectedClientId,
  onSelectClient,
  initialSearchTerm,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddFiling,
  onUpdateFiling,
  onDeleteFiling,
  onAddFee,
  onUpdateFee,
  onDeleteFee,
  onAddDocument,
  onDeleteDocument,
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice
}: ClientsViewProps) {
  // State for Lists
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');

  useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [atlFilter, setAtlFilter] = useState<string>('All');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form states (Add/Edit Client)
  const [formName, setFormName] = useState('');
  const [formCnic, setFormCnic] = useState('');
  const [formNtn, setFormNtn] = useState('');
  const [formStrn, setFormStrn] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formClientType, setFormClientType] = useState<ClientType>('Salaried');
  const [formAtlStatus, setFormAtlStatus] = useState<ATLStatus>('Active');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Sub-tabs in Detail View
  const [detailTab, setDetailTab] = useState<'overview' | 'filings' | 'fees' | 'documents' | 'notices' | 'logs'>('overview');

  // Sub-modal Forms for related data in Detail view
  const [isSubModalOpen, setIsSubModalOpen] = useState<'filing' | 'fee' | 'document' | 'notice' | null>(null);
  
  // Sub-form states
  const [subFilingType, setSubFilingType] = useState<FilingType>('Income Tax Return');
  const [subFilingPeriod, setSubFilingPeriod] = useState('Tax Year 2025');
  const [subFilingDeadline, setSubFilingDeadline] = useState('2026-09-30');
  const [subFilingStatus, setSubFilingStatus] = useState<FilingStatus>('Not Started');
  const [subFilingAck, setSubFilingAck] = useState('');

  const [subFeeType, setSubFeeType] = useState<FeeType>('Per-Return');
  const [subFeeAmount, setSubFeeAmount] = useState<number>(15000);
  const [subFeePaid, setSubFeePaid] = useState<number>(0);
  const [subFeeDueDate, setSubFeeDueDate] = useState('2026-07-31');
  const [subFeeMethod, setSubFeeMethod] = useState<PaymentMethod>('Unpaid');

  const [subNoticeType, setSubNoticeType] = useState('Section 114 (Notice to File Return)');
  const [subNoticeDeadline, setSubNoticeDeadline] = useState('2026-07-20');
  const [subNoticeNotes, setSubNoticeNotes] = useState('');

  // Client Detail Info
  const activeClient = clients.find(c => c.id === selectedClientId);

  // Format CNIC helper
  const handleCnicChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // digits only
    if (val.length > 13) val = val.substring(0, 13);
    
    // Add dashes: XXXXX-XXXXXXX-X
    let formatted = '';
    if (val.length > 5) {
      formatted += val.substring(0, 5) + '-';
      if (val.length > 12) {
        formatted += val.substring(5, 12) + '-' + val.substring(12, 13);
      } else {
        formatted += val.substring(5);
      }
    } else {
      formatted = val;
    }
    setFormCnic(formatted);
  };

  // Format NTN helper
  const handleNtnChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // digits only
    if (val.length > 8) val = val.substring(0, 8);
    
    // Add dash: XXXXXXX-X
    let formatted = '';
    if (val.length > 7) {
      formatted += val.substring(0, 7) + '-' + val.substring(7, 8);
    } else {
      formatted = val;
    }
    setFormNtn(formatted);
  };

  const handleExportToCSV = () => {
    // Basic CSV columns
    const headers = ['Client ID', 'Name', 'Client Type', 'CNIC', 'NTN', 'STRN', 'Phone', 'Email', 'Address', 'ATL Status', 'Notes', 'Created At'];
    
    // Format rows
    const rows = clients.map(client => {
      return [
        client.id,
        client.name,
        client.client_type,
        client.cnic,
        client.ntn,
        client.strn || '',
        client.phone,
        client.email,
        client.address,
        client.atl_status,
        client.notes || '',
        new Date(client.created_at).toLocaleDateString('en-PK')
      ].map(val => {
        // Escape quotes and wrap in double quotes if there are commas, newlines or quotes
        const stringVal = String(val ?? '');
        const escaped = stringVal.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
          return `"${escaped}"`;
        }
        return escaped;
      });
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Create blob and download link
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bilal_Tax_Firm_Clients_Master_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAddDrawer = () => {
    setIsEditing(false);
    setEditingClient(null);
    setFormName('');
    setFormCnic('');
    setFormNtn('');
    setFormStrn('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormClientType('Salaried');
    setFormAtlStatus('Active');
    setFormNotes('');
    setFormError('');
    setIsAddDrawerOpen(true);
  };

  const handleOpenEditDrawer = (client: Client) => {
    setIsEditing(true);
    setEditingClient(client);
    setFormName(client.name);
    setFormCnic(client.cnic);
    setFormNtn(client.ntn);
    setFormStrn(client.strn || '');
    setFormPhone(client.phone);
    setFormEmail(client.email);
    setFormAddress(client.address);
    setFormClientType(client.client_type);
    setFormAtlStatus(client.atl_status);
    setFormNotes(client.notes || '');
    setFormError('');
    setIsAddDrawerOpen(true);
  };

  const handleClientSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formName || !formCnic || !formNtn || !formPhone || !formEmail || !formAddress) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (formCnic.length < 15) {
      setFormError('Invalid CNIC. Must be 13 digits with dashes (XXXXX-XXXXXXX-X).');
      return;
    }

    if (formNtn.length < 9) {
      setFormError('Invalid NTN. Must be 8 digits with a dash (XXXXXXX-X).');
      return;
    }

    const payload = {
      name: formName,
      cnic: formCnic,
      ntn: formNtn,
      strn: formStrn || undefined,
      phone: formPhone,
      email: formEmail,
      address: formAddress,
      client_type: formClientType,
      atl_status: formAtlStatus,
      notes: formNotes || undefined
    };

    try {
      if (isEditing && editingClient) {
        await onUpdateClient(editingClient.id, payload);
      } else {
        await onAddClient(payload);
      }
      setIsAddDrawerOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    }
  };

  const handleDeleteClientClick = async (id: string) => {
    if (confirm('Are you absolutely sure you want to delete this client? This will remove ALL tax filings, fee invoices, documents, and notices associated with them.')) {
      await onDeleteClient(id);
      onSelectClient(null);
    }
  };

  // --- SUB SUBMISSIONS ---
  const handleAddFilingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    
    await onAddFiling({
      client_id: selectedClientId,
      filing_type: subFilingType,
      tax_period: subFilingPeriod,
      deadline: subFilingDeadline + 'T23:59:59',
      status: subFilingStatus,
      filed_date: (subFilingStatus === 'Filed' || subFilingStatus === 'Acknowledged') ? new Date().toISOString() : undefined,
      iris_ack_number: subFilingAck || undefined
    });
    
    setIsSubModalOpen(null);
    setSubFilingAck('');
  };

  const handleAddFeeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    await onAddFee({
      client_id: selectedClientId,
      fee_type: subFeeType,
      amount: Number(subFeeAmount),
      amount_paid: Number(subFeePaid),
      due_date: subFeeDueDate + 'T23:59:59',
      payment_method: subFeeMethod !== 'Unpaid' ? subFeeMethod : undefined,
      payment_date: subFeePaid > 0 ? new Date().toISOString() : undefined
    });

    setIsSubModalOpen(null);
  };

  const handleAddNoticeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    await onAddNotice({
      client_id: selectedClientId,
      notice_type: subNoticeType,
      date_received: new Date().toISOString(),
      response_deadline: subNoticeDeadline + 'T23:59:59',
      status: 'Pending',
      notes: subNoticeNotes || undefined
    });

    setIsSubModalOpen(null);
    setSubNoticeNotes('');
  };

  // Handle Mock Document Upload
  const handleDocUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!selectedClientId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    let type = 'Other';
    if (file.name.toLowerCase().includes('cnic')) type = 'CNIC';
    else if (file.name.toLowerCase().includes('salary')) type = 'Salary Certificate';
    else if (file.name.toLowerCase().includes('bank') || file.name.toLowerCase().includes('statement')) type = 'Bank Statement';
    else if (file.name.toLowerCase().includes('tax') || file.name.toLowerCase().includes('challan')) type = 'Tax Challan';

    await onAddDocument({
      client_id: selectedClientId,
      file_name: file.name,
      file_type: type,
      file_url: '#'
    });
  };

  const handleApplyClientTemplate = (template: 'Salaried' | 'SmallBusiness') => {
    if (template === 'Salaried') {
      setFormClientType('Salaried');
      setFormAtlStatus('Active');
      setFormNotes('Standard salaried individual tax return. Only requires salary certificate and wealth statement.');
    } else if (template === 'SmallBusiness') {
      setFormClientType('Business Individual');
      setFormAtlStatus('Active');
      setFormNotes('Small business entity. Requires income tax return, monthly sales tax returns, and basic bookkeeping.');
    }
  };

  const handleApplyFilingTemplate = (template: 'IncomeTax' | 'SalesTax') => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    if (template === 'IncomeTax') {
      setSubFilingType('Income Tax Return');
      setSubFilingPeriod(`Tax Year ${new Date().getFullYear()}`);
      setSubFilingDeadline(`${new Date().getFullYear()}-09-30`);
      setSubFilingStatus('Not Started');
    } else if (template === 'SalesTax') {
      setSubFilingType('Sales Tax Return');
      setSubFilingPeriod(nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      const monthStr = (nextMonth.getMonth() + 1).toString().padStart(2, '0');
      setSubFilingDeadline(`${nextMonth.getFullYear()}-${monthStr}-18`);
      setSubFilingStatus('Not Started');
    }
  };

  // Filter clients list
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnic.includes(searchTerm) ||
      c.ntn.includes(searchTerm) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All' || c.client_type === typeFilter;
    const matchesAtl = atlFilter === 'All' || c.atl_status === atlFilter;

    return matchesSearch && matchesType && matchesAtl;
  });

  // Calculate client specific deadlines and fees
  const getClientStats = (clientId: string) => {
    const clientFilings = filings.filter(f => f.client_id === clientId && f.status !== 'Filed' && f.status !== 'Acknowledged');
    const clientFees = fees.filter(fe => fe.client_id === clientId);
    const clientNotices = notices.filter(n => n.client_id === clientId && n.status === 'Pending');

    const outstandingFee = clientFees.reduce((sum, fe) => sum + fe.balance_due, 0);

    // Get soonest deadline
    let nextDeadlineStr = '--';
    let overdueCount = 0;
    if (clientFilings.length > 0) {
      const sortedFilings = [...clientFilings].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      nextDeadlineStr = new Date(sortedFilings[0].deadline).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
      
      overdueCount = clientFilings.filter(f => isOverdue(f.deadline, f.status)).length;
    }

    return {
      outstandingFee,
      nextDeadlineStr,
      overdueCount,
      activeNotices: clientNotices.length
    };
  };

  return (
    <div className="font-sans relative">
      <AnimatePresence mode="wait">
        {!activeClient ? (
          // --- MASTER LIST VIEW ---
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clients Directory</h2>
                <p className="text-sm text-slate-500">Search and manage firm taxpayers, ATL status, and billing balances.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleExportToCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-[#0F2C5C] hover:bg-slate-50 hover:text-[#1A4584] hover:border-slate-300 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4 text-[#10B981]" />
                  Export CSV
                </button>

                <button
                  onClick={handleOpenAddDrawer}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#10B981] hover:bg-[#0da473] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Register New Client
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="flex-1 relative">
                <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate-400 my-auto" />
                <input
                  type="text"
                  placeholder="Search by client name, CNIC, NTN, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C5C] focus:border-[#0F2C5C]"
                />
              </div>

              {/* Client Type Filter */}
              <div className="w-full md:w-48 flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                >
                  <option value="All">All Client Types</option>
                  <option value="Salaried">Salaried</option>
                  <option value="Business Individual">Business Individual</option>
                  <option value="AOP">AOP (Partnership)</option>
                  <option value="Company">Company</option>
                </select>
              </div>

              {/* ATL Status Filter */}
              <div className="w-full md:w-44">
                <select
                  value={atlFilter}
                  onChange={(e) => setAtlFilter(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                >
                  <option value="All">All ATL Status</option>
                  <option value="Active">Active ATL</option>
                  <option value="Inactive">Inactive ATL</option>
                </select>
              </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-6">Taxpayer Name</th>
                      <th className="py-3 px-6">CNIC & NTN</th>
                      <th className="py-3 px-6">Client Type</th>
                      <th className="py-3 px-6">ATL Status</th>
                      <th className="py-3 px-6">Outstanding Balance</th>
                      <th className="py-3 px-6">Next Deadline</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                          No taxpayers found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const { outstandingFee, nextDeadlineStr, overdueCount, activeNotices } = getClientStats(client.id);

                        return (
                          <tr
                            key={client.id}
                            className="hover:bg-slate-50/70 cursor-pointer group transition-all"
                            onClick={() => onSelectClient(client.id)}
                          >
                            <td className="py-4.5 px-6">
                              <span className="font-bold text-slate-800 text-sm block group-hover:text-[#0F2C5C]">{client.name}</span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">{client.email}</span>
                            </td>
                            <td className="py-4.5 px-6">
                              <span className="text-xs font-mono font-medium text-slate-600 block">CNIC: {client.cnic}</span>
                              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">NTN: {client.ntn}</span>
                            </td>
                            <td className="py-4.5 px-6">
                              <span className="text-xs font-medium text-slate-600">{client.client_type}</span>
                            </td>
                            <td className="py-4.5 px-6">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                client.atl_status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {client.atl_status}
                              </span>
                            </td>
                            <td className="py-4.5 px-6">
                              <span className={`text-sm font-semibold ${outstandingFee > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                                ₨ {outstandingFee.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4.5 px-6">
                              {overdueCount > 0 ? (
                                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md animate-pulse-glow border border-rose-200">
                                  Overdue Return
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-slate-600">
                                  {nextDeadlineStr}
                                </span>
                              )}
                            </td>
                            <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={() => handleOpenEditDrawer(client)}
                                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                                  title="Edit Client"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClientClick(client.id)}
                                  className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Client"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          // --- DETAILED CLIENT VIEW ---
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Header navigation */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectClient(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{activeClient.name}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeClient.atl_status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {activeClient.atl_status}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-medium">{activeClient.client_type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
                    <span>CNIC: {activeClient.cnic}</span>
                    <span>•</span>
                    <span>NTN: {activeClient.ntn}</span>
                    {activeClient.strn && (
                      <>
                        <span>•</span>
                        <span>STRN: {activeClient.strn}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons inside detail header */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenEditDrawer(activeClient)}
                  className="inline-flex items-center gap-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Client Info
                </button>
                
                <button
                  onClick={() => setIsSubModalOpen('filing')}
                  className="inline-flex items-center gap-1 py-1.5 px-3 bg-[#0F2C5C] hover:bg-[#1A4584] text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Filing
                </button>

                <button
                  onClick={() => setIsSubModalOpen('fee')}
                  className="inline-flex items-center gap-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Invoice Fee
                </button>
              </div>
            </div>

            {/* Sub Tabs Selection */}
            <div className="border-b border-slate-200 flex overflow-x-auto gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'filings', label: 'Filings', icon: FileText },
                { id: 'fees', label: 'Fees & Billings', icon: CreditCard },
                { id: 'documents', label: 'Documents', icon: Upload },
                { id: 'notices', label: 'FBR Notices', icon: BellDot },
                { id: 'logs', label: 'Activity Log', icon: Activity }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = detailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? 'border-[#0F2C5C] text-[#0F2C5C]' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <TabIcon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <AnimatePresence mode="wait">
                {/* 1. OVERVIEW */}
                {detailTab === 'overview' && (
                  <motion.div
                    key="overview-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left: contact details */}
                      <div className="md:col-span-2 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b pb-2">Contact & Taxpayer Profile</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Phone Number</span>
                              <span className="text-sm font-medium text-slate-700">{activeClient.phone}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Email Address</span>
                              <span className="text-sm font-medium text-slate-700 block truncate">{activeClient.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Registered Address</span>
                              <span className="text-sm font-medium text-slate-700">{activeClient.address}</span>
                            </div>
                          </div>
                        </div>

                        {activeClient.notes && (
                          <div className="mt-4">
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider mb-2">Internal Client Notes</span>
                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {activeClient.notes}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Snapshot metrics */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b pb-2">CRM Snapshot</h3>
                        
                        {/* Outstanding fee snapshot */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Outstanding Fees</span>
                          <span className="text-2xl font-bold text-slate-900 block mt-1">
                            ₨ {fees.filter(fe => fe.client_id === activeClient.id).reduce((sum, f) => sum + f.balance_due, 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Pending Returns</span>
                          <span className="text-2xl font-bold text-slate-900 block mt-1">
                            {filings.filter(f => f.client_id === activeClient.id && f.status !== 'Filed' && f.status !== 'Acknowledged').length} Returns
                          </span>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Active FBR Notices</span>
                          <span className="text-2xl font-bold text-rose-600 block mt-1">
                            {notices.filter(n => n.client_id === activeClient.id && n.status === 'Pending').length} Pending
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. FILINGS */}
                {detailTab === 'filings' && (
                  <motion.div
                    key="filings-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Filing History</h3>
                      <button
                        onClick={() => setIsSubModalOpen('filing')}
                        className="inline-flex items-center gap-1 py-1 px-2.5 bg-[#0F2C5C] hover:bg-[#1A4584] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Return Filing
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-lg">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                          <tr>
                            <th className="py-2 px-4">Filing Type</th>
                            <th className="py-2 px-4">Tax Period</th>
                            <th className="py-2 px-4">Deadline</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4">IRIS Ack No</th>
                            <th className="py-2 px-4 text-right">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filings.filter(f => f.client_id === activeClient.id).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-400">No return filings registered for this client.</td>
                            </tr>
                          ) : (
                            filings.filter(f => f.client_id === activeClient.id).map((filing) => (
                              <tr key={filing.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-bold text-slate-800">{filing.filing_type}</td>
                                <td className="py-3 px-4 text-slate-600">{filing.tax_period}</td>
                                <td className="py-3 px-4">
                                  <span className={isOverdue(filing.deadline, filing.status) ? "text-rose-600 font-bold" : "text-slate-600"}>
                                    {new Date(filing.deadline).toLocaleDateString('en-PK')}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={filing.status}
                                    onChange={(e) => onUpdateFiling(filing.id, { status: e.target.value as FilingStatus })}
                                    className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                                  >
                                    <option value="Not Started">Not Started</option>
                                    <option value="Documents Pending">Documents Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Filed">Filed</option>
                                    <option value="Acknowledged">Acknowledged</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  {filing.status === 'Filed' || filing.status === 'Acknowledged' ? (
                                    <input
                                      type="text"
                                      placeholder="IRIS Code"
                                      value={filing.iris_ack_number || ''}
                                      onChange={(e) => onUpdateFiling(filing.id, { iris_ack_number: e.target.value })}
                                      className="px-2 py-0.5 max-w-36 font-mono text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                                    />
                                  ) : (
                                    <span className="text-slate-400 font-medium">N/A</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => onDeleteFiling(filing.id)}
                                    className="p-1 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* 3. FEES */}
                {detailTab === 'fees' && (
                  <motion.div
                    key="fees-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Fee Invoices & Payments</h3>
                      <button
                        onClick={() => setIsSubModalOpen('fee')}
                        className="inline-flex items-center gap-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Invoice New Fee
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-lg">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                          <tr>
                            <th className="py-2 px-4">Fee Type</th>
                            <th className="py-2 px-4">Amount</th>
                            <th className="py-2 px-4">Paid</th>
                            <th className="py-2 px-4">Balance Due</th>
                            <th className="py-2 px-4">Due Date</th>
                            <th className="py-2 px-4">Payment Method</th>
                            <th className="py-2 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {fees.filter(f => f.client_id === activeClient.id).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-4 text-center text-slate-400">No billings registered for this client.</td>
                            </tr>
                          ) : (
                            fees.filter(f => f.client_id === activeClient.id).map((fee) => (
                              <tr key={fee.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-bold text-slate-800">{fee.fee_type}</td>
                                <td className="py-3 px-4 text-slate-700">₨ {fee.amount.toLocaleString()}</td>
                                <td className="py-3 px-4 text-slate-600">₨ {fee.amount_paid.toLocaleString()}</td>
                                <td className="py-3 px-4 font-semibold text-amber-600">₨ {fee.balance_due.toLocaleString()}</td>
                                <td className="py-3 px-4 text-slate-600">{new Date(fee.due_date).toLocaleDateString('en-PK')}</td>
                                <td className="py-3 px-4">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${fee.payment_method ? 'bg-slate-100 text-slate-800' : 'bg-amber-50 text-amber-800 border border-amber-100'}`}>
                                    {fee.payment_method || 'Unpaid'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    {fee.balance_due > 0 && (
                                      <button
                                        onClick={() => {
                                          const amt = prompt(`Log payment for ${fee.fee_type}. Remaining Balance is ₨ ${fee.balance_due}. Enter amount received in PKR:`, String(fee.balance_due));
                                          if (amt !== null) {
                                            const paidNum = Number(amt);
                                            if (isNaN(paidNum) || paidNum <= 0) alert('Please enter a valid positive number');
                                            else {
                                              const finalPaid = fee.amount_paid + paidNum;
                                              const method = prompt('Enter payment method (Cash / Bank Transfer / Cheque):', 'Bank Transfer') as PaymentMethod;
                                              onUpdateFee(fee.id, {
                                                amount_paid: finalPaid,
                                                payment_method: method || 'Bank Transfer',
                                                payment_date: new Date().toISOString()
                                              });
                                            }
                                          }
                                        }}
                                        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-all cursor-pointer"
                                      >
                                        Log Payment
                                      </button>
                                    )}
                                    <button
                                      onClick={() => onDeleteFee(fee.id)}
                                      className="p-1 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* 4. DOCUMENTS */}
                {detailTab === 'documents' && (
                  <motion.div
                    key="documents-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Tax Documents Repository</h3>

                    {/* Simple drag and drop box */}
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition-all relative">
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Drag & drop tax documents here</p>
                      <p className="text-xs text-slate-400 mt-1">or click to upload PDFs, Images, or Excel spreadsheets (CNIC, bank statements, salary certificates)</p>
                      <input
                        type="file"
                        onChange={handleDocUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title=""
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {documents.filter(d => d.client_id === activeClient.id).length === 0 ? (
                        <div className="col-span-full py-6 text-center text-slate-400 text-xs">
                          No document files uploaded yet.
                        </div>
                      ) : (
                        documents.filter(d => d.client_id === activeClient.id).map((doc) => (
                          <div key={doc.id} className="p-3.5 border border-slate-200 rounded-lg flex items-center justify-between gap-2 hover:border-slate-300">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate" title={doc.file_name}>{doc.file_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400 font-mono">{doc.file_type}</span>
                                <span className="text-[10px] text-slate-400">•</span>
                                <span className="text-[9px] text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString('en-PK')}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); alert('Downloading of documents requires server sync. This mock file has been triggered safely!'); }}
                                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500"
                                title="Download File"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => onDeleteDocument(doc.id)}
                                className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 5. NOTICES */}
                {detailTab === 'notices' && (
                  <motion.div
                    key="notices-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">FBR Notices & Actions</h3>
                      <button
                        onClick={() => setIsSubModalOpen('notice')}
                        className="inline-flex items-center gap-1 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Log FBR Notice
                      </button>
                    </div>

                    <div className="space-y-3">
                      {notices.filter(n => n.client_id === activeClient.id).length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          No FBR Notices logged for this taxpayer.
                        </div>
                      ) : (
                        notices.filter(n => n.client_id === activeClient.id).map((notice) => (
                          <div
                            key={notice.id}
                            className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                              notice.status === 'Pending' 
                                ? (isOverdue(notice.response_deadline, notice.status) ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/50 border-slate-200')
                                : 'bg-slate-50 border-slate-200 opacity-75'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800 text-sm">{notice.notice_type}</span>
                                {isOverdue(notice.response_deadline, notice.status) && notice.status === 'Pending' && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md animate-pulse-glow">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                              {notice.notes && (
                                <p className="text-xs text-slate-600 leading-relaxed font-medium mt-1">{notice.notes}</p>
                              )}
                              <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                                <span>Received: {new Date(notice.date_received).toLocaleDateString('en-PK')}</span>
                                <span>Deadline: <span className={isOverdue(notice.response_deadline, notice.status) ? 'text-rose-600 font-bold' : ''}>{new Date(notice.response_deadline).toLocaleDateString('en-PK')}</span></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                              <select
                                value={notice.status}
                                onChange={(e) => onUpdateNotice(notice.id, { status: e.target.value as NoticeStatus })}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Responded">Responded</option>
                                <option value="Closed">Closed</option>
                              </select>

                              <button
                                onClick={() => onDeleteNotice(notice.id)}
                                className="p-1.5 hover:bg-rose-100 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 6. LOGS */}
                {detailTab === 'logs' && (
                  <motion.div
                    key="logs-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Client Activity Log</h3>
                    <div className="divide-y divide-slate-100 text-xs">
                      {activities.filter(a => a.client_id === activeClient.id).length === 0 ? (
                        <div className="p-4 text-center text-slate-400">No activity logged for this client yet.</div>
                      ) : (
                        activities.filter(a => a.client_id === activeClient.id).map((log) => (
                          <div key={log.id} className="py-3 flex items-start gap-3">
                            <Activity className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800">{log.action}</p>
                              <p className="text-slate-600 mt-0.5 font-medium leading-relaxed">{log.details}</p>
                              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                                {new Date(log.timestamp).toLocaleString('en-PK')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADD/EDIT CLIENT DRAWER (Slide-in from right) --- */}
      <AnimatePresence>
        {isAddDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col h-full font-sans border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-950 text-lg">
                    {isEditing ? 'Modify Client Details' : 'Register New Taxpayer'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enter core legal & financial details.</p>
                </div>
                <button
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Form */}
              <form onSubmit={handleClientSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {!isEditing && (
                  <div className="flex flex-wrap gap-2 mb-2 items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> Quick Fill Templates:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyClientTemplate('Salaried')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 shadow-xs transition-colors cursor-pointer"
                    >
                      Salaried Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyClientTemplate('SmallBusiness')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 shadow-xs transition-colors cursor-pointer"
                    >
                      Small Business
                    </button>
                  </div>
                )}

                {formError && (
                  <div className="rounded-lg bg-rose-50 p-3.5 border border-rose-100 text-xs font-semibold text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Taxpayer Full Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Muhammad Ali Khan"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                  />
                </div>

                {/* CNIC */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">CNIC (13 digits) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formCnic}
                    onChange={handleCnicChange}
                    placeholder="35201-1234567-9"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                  />
                </div>

                {/* NTN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">FBR NTN (8 digits) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formNtn}
                    onChange={handleNtnChange}
                    placeholder="1234567-8"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                  />
                </div>

                {/* STRN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Sales Tax Registration (STRN) <span className="text-slate-400">(Optional)</span></label>
                  <input
                    type="text"
                    value={formStrn}
                    onChange={(e) => setFormStrn(e.target.value.replace(/\D/g, '').substring(0, 13))}
                    placeholder="13-digit sales tax registry"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                  />
                </div>

                {/* Client Type & ATL */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Client Type</label>
                    <select
                      value={formClientType}
                      onChange={(e) => setFormClientType(e.target.value as ClientType)}
                      className="mt-1 block w-full px-2 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Business Individual">Business Individual</option>
                      <option value="AOP">AOP (Partnership)</option>
                      <option value="Company">Company</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">ATL Status</label>
                    <select
                      value={formAtlStatus}
                      onChange={(e) => setFormAtlStatus(e.target.value as ATLStatus)}
                      className="mt-1 block w-full px-2 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Contact: Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Phone <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="client@domain.com"
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-1"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Registered Address <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Physical address for correspondence"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-1"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Special Consulting Notes</label>
                  <textarea
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Specific tax rules, corporate requirements, outstanding audit details..."
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-1"
                  />
                </div>

                {/* Action buttons inside drawer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddDrawerOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0F2C5C] hover:bg-[#1A4584] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    {isEditing ? 'Save Changes' : 'Register Taxpayer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- SUB MODALS (Adding related records inside Detail view) --- */}
      <AnimatePresence>
        {isSubModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubModalOpen(null)}
              className="fixed inset-0 bg-black z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-0 top-20 mx-auto w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden font-sans"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h4 className="font-bold text-slate-900 text-sm">
                  {isSubModalOpen === 'filing' && 'Schedule Tax return filing'}
                  {isSubModalOpen === 'fee' && 'Create Fee Invoice'}
                  {isSubModalOpen === 'notice' && 'Log Received FBR Notice'}
                </h4>
                <button onClick={() => setIsSubModalOpen(null)} className="p-1 hover:bg-slate-200 text-slate-400 rounded-md">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* FILING FORM */}
              {isSubModalOpen === 'filing' && (
                <form onSubmit={handleAddFilingSubmit} className="p-5 space-y-4">
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Filing Return Type</label>
                    <select
                      value={subFilingType}
                      onChange={(e) => setSubFilingType(e.target.value as FilingType)}
                      className="mt-1 block w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="Income Tax Return">Income Tax Return</option>
                      <option value="Wealth Statement">Wealth Statement</option>
                      <option value="Sales Tax Return">Sales Tax Return</option>
                      <option value="Withholding Statement">Withholding Statement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Tax Period / Year</label>
                    <input
                      type="text"
                      required
                      value={subFilingPeriod}
                      onChange={(e) => setSubFilingPeriod(e.target.value)}
                      placeholder="e.g. Tax Year 2025"
                      className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Submission Deadline</label>
                      <input
                        type="date"
                        required
                        value={subFilingDeadline}
                        onChange={(e) => setSubFilingDeadline(e.target.value)}
                        className="mt-1 block w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Initial Status</label>
                      <select
                        value={subFilingStatus}
                        onChange={(e) => setSubFilingStatus(e.target.value as FilingStatus)}
                        className="mt-1 block w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="Documents Pending">Documents Pending</option>
                        <option value="In Progress">In Progress</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button type="button" onClick={() => setIsSubModalOpen(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-[#0F2C5C] text-white text-xs font-bold rounded-lg shadow-sm">Schedule Return</button>
                  </div>
                </form>
              )}

              {/* FEE FORM */}
              {isSubModalOpen === 'fee' && (
                <form onSubmit={handleAddFeeSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Fee Category</label>
                    <select
                      value={subFeeType}
                      onChange={(e) => setSubFeeType(e.target.value as FeeType)}
                      className="mt-1 block w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="Per-Return">Per-Return Return Charge</option>
                      <option value="Retainer">Corporate Monthly Retainer</option>
                      <option value="Extra Charge">Extra Notice Audit Fee</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Total Billed (PKR)</label>
                      <input
                        type="number"
                        required
                        value={subFeeAmount}
                        onChange={(e) => setSubFeeAmount(Number(e.target.value))}
                        className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Amount Paid (PKR)</label>
                      <input
                        type="number"
                        required
                        value={subFeePaid}
                        onChange={(e) => setSubFeePaid(Number(e.target.value))}
                        className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Due Date</label>
                      <input
                        type="date"
                        required
                        value={subFeeDueDate}
                        onChange={(e) => setSubFeeDueDate(e.target.value)}
                        className="mt-1 block w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Method</label>
                      <select
                        value={subFeeMethod}
                        onChange={(e) => setSubFeeMethod(e.target.value as PaymentMethod)}
                        className="mt-1 block w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button type="button" onClick={() => setIsSubModalOpen(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm">Invoice Client</button>
                  </div>
                </form>
              )}

              {/* NOTICE FORM */}
              {isSubModalOpen === 'notice' && (
                <form onSubmit={handleAddNoticeSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Notice Type / FBR Section</label>
                    <input
                      type="text"
                      required
                      value={subNoticeType}
                      onChange={(e) => setSubNoticeType(e.target.value)}
                      placeholder="e.g. Section 122 Amendment / Audit 177"
                      className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Response Deadline</label>
                    <input
                      type="date"
                      required
                      value={subNoticeDeadline}
                      onChange={(e) => setSubNoticeDeadline(e.target.value)}
                      className="mt-1 block w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Notice Description / Allegations</label>
                    <textarea
                      rows={3}
                      value={subNoticeNotes}
                      onChange={(e) => setSubNoticeNotes(e.target.value)}
                      placeholder="e.g. FBR alleges under-reported sales of 5.5M in FY24 audits. Ledger needed."
                      className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button type="button" onClick={() => setIsSubModalOpen(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm">Log Notice</button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
