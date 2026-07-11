/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { db } from './services/db';
import { 
  Client, 
  Filing, 
  Fee, 
  Document, 
  Notice, 
  ActivityLog, 
  DashboardStats 
} from './types';

// Component imports
import Sidebar, { TabID } from './components/Sidebar';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import FilingsView from './components/FilingsView';
import FeesView from './components/FeesView';
import DocumentsView from './components/DocumentsView';
import NoticesView from './components/NoticesView';
import SettingsView from './components/SettingsView';

// Icons for toast and indicators
import { CheckCircle2, AlertCircle, Info, X, Search, Users, FileSpreadsheet, CreditCard, ChevronRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  // Authentication Guard
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<TabID>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Global Search and Tab-specific filter states
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [clientsSearchTerm, setClientsSearchTerm] = useState('');
  const [filingsSearchTerm, setFilingsSearchTerm] = useState('');
  const [feesSearchTerm, setFeesSearchTerm] = useState('');

  // Database States
  const [clients, setClients] = useState<Client[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalActiveClients: 0,
    filingsDueThisMonth: 0,
    overdueFilings: 0,
    totalFeesOutstanding: 0
  });

  // Micro-interactions: Toasts List
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Check login on load
  useEffect(() => {
    const loggedIn = localStorage.getItem('btf_logged_in') === 'true';
    const email = localStorage.getItem('btf_user_email') || '';
    if (loggedIn && email) {
      setIsLoggedIn(true);
      setUserEmail(email);
    }
  }, []);

  // Fetch all database records
  const refreshData = async () => {
    const c = await db.getClients();
    const fi = await db.getFilings();
    const fe = await db.getFees();
    const doc = await db.getDocuments();
    const n = await db.getNotices();
    const act = await db.getActivityLogs();
    const st = await db.getDashboardStats();

    setClients(c);
    setFilings(fi);
    setFees(fe);
    setDocuments(doc);
    setNotices(n);
    setActivities(act);
    setStats(st);
  };

  // Sync data on mount or auth change
  useEffect(() => {
    if (isLoggedIn) {
      refreshData();
    }
  }, [isLoggedIn]);

  // Toast helper
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // --- ACTIONS ---
  const handleLogin = (email: string) => {
    localStorage.setItem('btf_logged_in', 'true');
    localStorage.setItem('btf_user_email', email);
    setUserEmail(email);
    setIsLoggedIn(true);
    addToast(`Welcome back, ${email.split('@')[0]}! Console loaded.`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('btf_logged_in');
    localStorage.removeItem('btf_user_email');
    setIsLoggedIn(false);
    setUserEmail('');
    setActiveTab('dashboard');
    setSelectedClientId(null);
  };

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'created_at'>) => {
    const client = await db.createClient(clientData);
    await refreshData();
    addToast(`Taxpayer "${client.name}" successfully registered!`, 'success');
    return client;
  };

  const handleUpdateClient = async (id: string, updatedData: Partial<Client>) => {
    const client = await db.updateClient(id, updatedData);
    await refreshData();
    addToast(`Client detail for "${client.name}" updated.`, 'success');
    return client;
  };

  const handleDeleteClient = async (id: string) => {
    const success = await db.deleteClient(id);
    if (success) {
      await refreshData();
      addToast('Client and all associated files deleted successfully.', 'info');
    }
    return success;
  };

  const handleAddFiling = async (filingData: Omit<Filing, 'id'>) => {
    const filing = await db.createFiling(filingData);
    await refreshData();
    addToast(`Filing Scheduled: ${filing.filing_type} for ${filing.tax_period}.`, 'success');
    return filing;
  };

  const handleUpdateFiling = async (id: string, updatedData: Partial<Filing>) => {
    const filing = await db.updateFiling(id, updatedData);
    await refreshData();
    
    // Trigger toast based on what changed
    if (updatedData.status === 'Filed') {
      addToast(`Filing marked as FILED! Receipt code generated. 🎉`, 'success');
    } else if (updatedData.status === 'Acknowledged') {
      addToast(`Filing ACKNOWLEDGED by FBR systems.`, 'success');
    } else {
      addToast(`Tax filing details updated.`, 'info');
    }
    return filing;
  };

  const handleDeleteFiling = async (id: string) => {
    const success = await db.deleteFiling(id);
    if (success) {
      await refreshData();
      addToast('Filing record removed.', 'info');
    }
    return success;
  };

  const handleAddFee = async (feeData: Omit<Fee, 'id' | 'balance_due'>) => {
    const fee = await db.createFee(feeData);
    await refreshData();
    addToast(`Invoiced: PKR ${fee.amount.toLocaleString()} for ${fee.fee_type}.`, 'success');
    return fee;
  };

  const handleUpdateFee = async (id: string, updatedData: Partial<Fee>) => {
    const fee = await db.updateFee(id, updatedData);
    await refreshData();
    
    if (updatedData.amount_paid !== undefined) {
      addToast(`Payment Logged: ₨ ${(updatedData.amount_paid - (fees.find(fe => fe.id === id)?.amount_paid || 0)).toLocaleString()} received! 💰`, 'success');
    } else {
      addToast(`Billing invoice adjusted.`, 'info');
    }
    return fee;
  };

  const handleDeleteFee = async (id: string) => {
    const success = await db.deleteFee(id);
    if (success) {
      await refreshData();
      addToast('Invoice record voided.', 'info');
    }
    return success;
  };

  const handleAddDocument = async (docData: Omit<Document, 'id' | 'uploaded_at'>) => {
    const doc = await db.createDocument(docData);
    await refreshData();
    addToast(`Document "${doc.file_name}" archived.`, 'success');
    return doc;
  };

  const handleDeleteDocument = async (id: string) => {
    const success = await db.deleteDocument(id);
    if (success) {
      await refreshData();
      addToast('Document permanently removed from archives.', 'info');
    }
    return success;
  };

  const handleAddNotice = async (noticeData: Omit<Notice, 'id'>) => {
    const notice = await db.createNotice(noticeData);
    await refreshData();
    addToast(`Logged FBR Notice: Section response deadline is ${notice.response_deadline.split('T')[0]}. ⚠️`, 'info');
    return notice;
  };

  const handleUpdateNotice = async (id: string, updatedData: Partial<Notice>) => {
    const notice = await db.updateNotice(id, updatedData);
    await refreshData();
    addToast(`Notice response status updated to: ${notice.status}.`, 'success');
    return notice;
  };

  const handleDeleteNotice = async (id: string) => {
    const success = await db.deleteNotice(id);
    if (success) {
      await refreshData();
      addToast('Official notice record removed.', 'info');
    }
    return success;
  };

  const handleResetToDefaults = async () => {
    await db.resetToDefaults();
    await refreshData();
    setSelectedClientId(null);
    addToast('System database successfully re-seeded.', 'info');
  };

  const handleNavigateToTab = (tabId: 'clients' | 'filings' | 'fees' | 'documents' | 'notices') => {
    setActiveTab(tabId);
    setSelectedClientId(null);
  };

  const handleSelectClientRedirect = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('clients');
  };

  // --- GLOBAL SEARCH ACTIONS ---
  const handleClientResultClick = (clientId: string) => {
    setSelectedClientId(clientId);
    setClientsSearchTerm(''); // clear to show details
    setActiveTab('clients');
    setGlobalSearch('');
    setIsSearchFocused(false);
    addToast('Viewing Client Profile', 'success');
  };

  const handleFilingResultClick = (filing: Filing, clientName: string) => {
    setFilingsSearchTerm(clientName);
    setActiveTab('filings');
    setGlobalSearch('');
    setIsSearchFocused(false);
    addToast(`Viewing tax filings for: ${clientName}`, 'success');
  };

  const handleFeeResultClick = (fee: Fee, clientName: string) => {
    setFeesSearchTerm(clientName);
    setActiveTab('fees');
    setGlobalSearch('');
    setIsSearchFocused(false);
    addToast(`Viewing outstanding billing for: ${clientName}`, 'success');
  };

  // Keyboard shortcut effect for '/' focus and 'Escape' blur/clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) (searchInput as HTMLInputElement).focus();
      }
      if (e.key === 'Escape') {
        setGlobalSearch('');
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) (searchInput as HTMLInputElement).blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute search results dynamically
  const getSearchResults = () => {
    const query = globalSearch.trim().toLowerCase();
    if (query.length < 2) return { clients: [], filings: [], fees: [] };

    const matchedClients = clients.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.ntn && c.ntn.toLowerCase().includes(query)) ||
      (c.cnic && c.cnic.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.toLowerCase().includes(query))
    ).slice(0, 5);

    const matchedFilings = filings.filter(f => {
      const client = clients.find(c => c.id === f.client_id);
      const clientName = client ? client.name.toLowerCase() : '';
      return f.filing_type.toLowerCase().includes(query) ||
        f.tax_period.toLowerCase().includes(query) ||
        clientName.includes(query) ||
        (f.iris_ack_number && f.iris_ack_number.toLowerCase().includes(query));
    }).map(f => ({
      ...f,
      clientName: clients.find(c => c.id === f.client_id)?.name || 'Unknown Taxpayer'
    })).slice(0, 5);

    const matchedFees = fees.filter(fe => {
      const client = clients.find(c => c.id === fe.client_id);
      const clientName = client ? client.name.toLowerCase() : '';
      return fe.fee_type.toLowerCase().includes(query) ||
        clientName.includes(query) ||
        fe.payment_method.toLowerCase().includes(query);
    }).map(fe => ({
      ...fe,
      clientName: clients.find(c => c.id === fe.client_id)?.name || 'Unknown Client'
    })).slice(0, 5);

    return {
      clients: matchedClients,
      filings: matchedFilings,
      fees: matchedFees
    };
  };

  const searchResults = getSearchResults();
  const hasSearchResults = searchResults.clients.length > 0 || searchResults.filings.length > 0 || searchResults.fees.length > 0;

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Dynamic Toast micro-interactions container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="bg-white border border-slate-200 shadow-xl rounded-xl p-4 flex items-start gap-3 pointer-events-auto select-none"
            >
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-[#0F2C5C] shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />}

              <div className="flex-1 min-w-0 pr-4">
                <p className="text-xs font-semibold text-slate-800">{toast.message}</p>
              </div>

              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Layout Grid */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // Reset client selection context when leaving clients tab
          if (tab !== 'clients') setSelectedClientId(null);
          // Clear search terms to prevent unexpected persistent filters on direct menu clicks
          setClientsSearchTerm('');
          setFilingsSearchTerm('');
          setFeesSearchTerm('');
        }} 
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      <main className="flex-1 h-screen overflow-hidden relative flex flex-col bg-slate-50">
        {/* Sticky Header with Real-Time Global Search */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-xs select-none shrink-0">
          {/* Global Search Bar */}
          <div className="relative w-full max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-400" />
            </div>
            <input
              id="global-search-input"
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay for click handlers to fire
              placeholder="Search clients, filings, or invoices... (Press '/' to focus)"
              className="block w-full pl-10 pr-12 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2C5C] focus:border-[#0F2C5C] focus:bg-white transition-all duration-150 font-medium"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">/</span>
            </div>

            {/* Floating Dropdown Results */}
            <AnimatePresence>
              {isSearchFocused && globalSearch.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[480px] overflow-y-auto"
                >
                  {!hasSearchResults ? (
                    <div className="p-6 text-center text-slate-500">
                      <p className="text-sm font-medium">No matches found for "{globalSearch}"</p>
                      <p className="text-xs text-slate-400 mt-1">Try searching name, NTN, CNIC, period, or type.</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-4">
                      {/* Clients Section */}
                      {searchResults.clients.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Taxpayers / Clients</span>
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {searchResults.clients.map(client => (
                              <button
                                key={client.id}
                                onMouseDown={() => handleClientResultClick(client.id)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl flex items-center justify-between group transition-colors cursor-pointer"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-800 group-hover:text-[#0F2C5C] transition-colors">{client.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    NTN: {client.ntn || 'N/A'} • CNIC: {client.cnic || 'N/A'}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Filings Section */}
                      {searchResults.filings.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />
                            <span>Tax Filings</span>
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {searchResults.filings.map(filing => (
                              <button
                                key={filing.id}
                                onMouseDown={() => handleFilingResultClick(filing, filing.clientName)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl flex items-center justify-between group transition-colors cursor-pointer"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-800 group-hover:text-[#0F2C5C] transition-colors">
                                    {filing.filing_type}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Taxpayer: <span className="font-medium text-slate-600">{filing.clientName}</span> • Period: {filing.tax_period}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                                    filing.status === 'Filed' || filing.status === 'Acknowledged' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {filing.status}
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fees Section */}
                      {searchResults.fees.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-amber-500" />
                            <span>Invoices & Billing</span>
                          </div>
                          <div className="mt-1 space-y-0.5">
                            {searchResults.fees.map(fee => (
                              <button
                                key={fee.id}
                                onMouseDown={() => handleFeeResultClick(fee, fee.clientName)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl flex items-center justify-between group transition-colors cursor-pointer"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-800 group-hover:text-[#0F2C5C] transition-colors">
                                    {fee.fee_type} Invoice
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Client: <span className="font-medium text-slate-600">{fee.clientName}</span> • Amount: PKR {fee.amount.toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                                    fee.balance_due === 0 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    {fee.balance_due === 0 ? 'Paid' : `₨ ${fee.balance_due.toLocaleString()} Due`}
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right section: Profile Quick Stats / Details */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900">Bilal Tax Firm Console</p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Secure Session Active
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[#0F2C5C] text-sm shadow-xs">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-700 leading-tight">Admin User</p>
                <p className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{userEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Container with standard padding */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedClientId || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-7xl mx-auto"
            >
              {activeTab === 'dashboard' && (
                <DashboardView 
                  stats={stats}
                  clients={clients}
                  filings={filings}
                  fees={fees}
                  activities={activities}
                  onAddClient={() => {
                    setActiveTab('clients');
                    setTimeout(() => {
                      const addBtn = document.querySelector('button[class*="Register New Client"]');
                      if (addBtn) (addBtn as HTMLButtonElement).click();
                    }, 100);
                  }}
                  onAddFiling={() => {
                    setActiveTab('filings');
                    setTimeout(() => {
                      const scheduleBtn = document.querySelector('button[class*="Schedule Filing"]');
                      if (scheduleBtn) (scheduleBtn as HTMLButtonElement).click();
                    }, 100);
                  }}
                  onAddFee={() => {
                    setActiveTab('fees');
                    setTimeout(() => {
                      const invoiceBtn = document.querySelector('button[class*="Invoice Client"]');
                      if (invoiceBtn) (invoiceBtn as HTMLButtonElement).click();
                    }, 100);
                  }}
                  onNavigateToTab={handleNavigateToTab}
                  onSelectClient={handleSelectClientRedirect}
                />
              )}

              {activeTab === 'clients' && (
                <ClientsView 
                  clients={clients}
                  filings={filings}
                  fees={fees}
                  documents={documents}
                  notices={notices}
                  activities={activities}
                  selectedClientId={selectedClientId}
                  onSelectClient={setSelectedClientId}
                  initialSearchTerm={clientsSearchTerm}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onAddFiling={handleAddFiling}
                  onUpdateFiling={handleUpdateFiling}
                  onDeleteFiling={handleDeleteFiling}
                  onAddFee={handleAddFee}
                  onUpdateFee={handleUpdateFee}
                  onDeleteFee={handleDeleteFee}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onAddNotice={handleAddNotice}
                  onUpdateNotice={handleUpdateNotice}
                  onDeleteNotice={handleDeleteNotice}
                />
              )}

              {activeTab === 'filings' && (
                <FilingsView 
                  filings={filings}
                  clients={clients}
                  onAddFiling={handleAddFiling}
                  onUpdateFiling={handleUpdateFiling}
                  onDeleteFiling={handleDeleteFiling}
                  onSelectClient={handleSelectClientRedirect}
                  initialSearchTerm={filingsSearchTerm}
                />
              )}

              {activeTab === 'fees' && (
                <FeesView 
                  fees={fees}
                  clients={clients}
                  onAddFee={handleAddFee}
                  onUpdateFee={handleUpdateFee}
                  onDeleteFee={handleDeleteFee}
                  onSelectClient={handleSelectClientRedirect}
                  initialSearchTerm={feesSearchTerm}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentsView 
                  documents={documents}
                  clients={clients}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onSelectClient={handleSelectClientRedirect}
                />
              )}

              {activeTab === 'notices' && (
                <NoticesView 
                  notices={notices}
                  clients={clients}
                  onAddNotice={handleAddNotice}
                  onUpdateNotice={handleUpdateNotice}
                  onDeleteNotice={handleDeleteNotice}
                  onSelectClient={handleSelectClientRedirect}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  clients={clients}
                  filings={filings}
                  fees={fees}
                  documents={documents}
                  notices={notices}
                  userEmail={userEmail}
                  onResetToDefaults={handleResetToDefaults}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
