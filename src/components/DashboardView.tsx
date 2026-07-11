/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarClock, 
  AlertTriangle, 
  DollarSign, 
  Plus, 
  ArrowRight, 
  Activity, 
  CheckCircle2, 
  Upload, 
  FileText, 
  UserPlus, 
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'motion/react';
import { Client, Filing, Fee, ActivityLog, DashboardStats } from '../types';
import AnimatedCounter from './AnimatedCounter';
import { isOverdue } from '../services/db';

interface DashboardViewProps {
  stats: DashboardStats;
  clients: Client[];
  filings: Filing[];
  fees: Fee[];
  activities: ActivityLog[];
  onAddClient: () => void;
  onAddFiling: () => void;
  onAddFee: () => void;
  onNavigateToTab: (tabId: 'clients' | 'filings' | 'fees' | 'documents' | 'notices') => void;
  onSelectClient: (clientId: string) => void;
}

export default function DashboardView({
  stats,
  clients,
  filings,
  fees,
  activities,
  onAddClient,
  onAddFiling,
  onAddFee,
  onNavigateToTab,
  onSelectClient
}: DashboardViewProps) {
  // Calculate billing collections for the Quick Summary card
  const totalBilled = fees.reduce((sum, fe) => sum + fe.amount, 0);
  const totalCollected = fees.reduce((sum, fe) => sum + fe.amount_paid, 0);
  const collectionPercent = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  // Compute upcoming filings sorted by deadline
  const [upcomingFilings, setUpcomingFilings] = useState<(Filing & { clientName?: string })[]>([]);

  useEffect(() => {
    const uncompleted = filings.filter(f => f.status !== 'Filed' && f.status !== 'Acknowledged');
    const sorted = [...uncompleted].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    
    const enriched = sorted.slice(0, 5).map(f => {
      const client = clients.find(c => c.id === f.client_id);
      return {
        ...f,
        clientName: client ? client.name : 'Unknown Client'
      };
    });
    setUpcomingFilings(enriched);
  }, [filings, clients]);

  // Helper to get days remaining
  const getDaysRemainingText = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    deadline.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-rose-600 bg-rose-50 border-rose-100' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-amber-600 bg-amber-50 border-amber-200 animate-pulse' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}d left`, color: 'text-amber-600 bg-amber-50 border-amber-100' };
    } else {
      return { text: `${diffDays}d left`, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    }
  };

  // Helper to format activity icons
  const getActivityIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('filed') || act.includes('acknowledged')) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 bg-emerald-50 rounded-full" />;
    }
    if (act.includes('payment') || act.includes('fee')) {
      return <CreditCard className="h-4 w-4 text-indigo-500 bg-indigo-50 rounded-full" />;
    }
    if (act.includes('client')) {
      return <UserPlus className="h-4 w-4 text-sky-500 bg-sky-50 rounded-full" />;
    }
    if (act.includes('document') || act.includes('uploaded')) {
      return <Upload className="h-4 w-4 text-teal-500 bg-teal-50 rounded-full" />;
    }
    return <Activity className="h-4 w-4 text-slate-500 bg-slate-50 rounded-full" />;
  };

  const formatActivityTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Tax Year 2025-2026 • {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        
        {/* Quick-Add Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onAddClient}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            + New Client
          </button>
          
          <button
            onClick={onAddFiling}
            className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-[#0da473] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            + New Filing
          </button>

          <button
            onClick={onAddFee}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            Invoice Client
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Clients */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => onNavigateToTab('clients')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer transition-all glass-shadow"
        >
          <div className="text-slate-500 text-xs font-bold uppercase mb-2 tracking-wider">Active Clients</div>
          <div className="text-3xl font-bold text-[#0F2C5C]">
            <AnimatedCounter value={stats.totalActiveClients} />
          </div>
          <div className="text-emerald-600 text-xs mt-2 font-medium">On Active Taxpayer List (ATL)</div>
        </motion.div>

        {/* Filings Due This Month */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          onClick={() => onNavigateToTab('filings')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer transition-all glass-shadow"
        >
          <div className="text-slate-500 text-xs font-bold uppercase mb-2 tracking-wider">Filings Due</div>
          <div className="text-3xl font-bold text-[#0F2C5C]">
            <AnimatedCounter value={stats.filingsDueThisMonth} />
          </div>
          <div className="text-slate-400 text-xs mt-2 font-medium">Due in current tax period</div>
        </motion.div>

        {/* Overdue Filings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => onNavigateToTab('filings')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer transition-all glass-shadow relative overflow-hidden"
        >
          <div className="text-slate-500 text-xs font-bold uppercase mb-2 tracking-wider">Overdue Filings</div>
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-bold ${stats.overdueFilings > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              <AnimatedCounter value={stats.overdueFilings} />
            </div>
            {stats.overdueFilings > 0 && (
              <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded overdue-pulse select-none">ACTION REQ.</span>
            )}
          </div>
          <div className="text-slate-400 text-xs mt-2 font-medium">
            {stats.overdueFilings > 0 ? `Across ${Math.max(1, Math.round(stats.overdueFilings * 0.7))} clients` : 'All prior return periods filed'}
          </div>
        </motion.div>

        {/* Total Outstanding Fees */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          onClick={() => onNavigateToTab('fees')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer transition-all glass-shadow"
        >
          <div className="text-slate-500 text-xs font-bold uppercase mb-2 tracking-wider">Fees Outstanding</div>
          <div className="text-2xl font-bold text-[#0F2C5C] block truncate">
            PKR {Math.round(stats.totalFeesOutstanding / 1000)}k
          </div>
          <div className="text-amber-600 text-xs mt-2 font-medium">Pending billing collection</div>
        </motion.div>
      </div>

      {/* Main Dashboard Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Upcoming Deadlines & Quick List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Upcoming Deadlines</h3>
                <p className="text-xs text-slate-500 mt-0.5">Filings requiring urgent documents or reviews.</p>
              </div>
              <button
                onClick={() => onNavigateToTab('filings')}
                className="text-xs font-medium text-[#0F2C5C] hover:text-[#1A4584] flex items-center gap-1 transition-all cursor-pointer"
              >
                View all filings <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {upcomingFilings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No upcoming unfiled tax filings.
                </div>
              ) : (
                upcomingFilings.map((filing) => {
                  const deadlineInfo = getDaysRemainingText(filing.deadline);
                  const isFilingOverdue = isOverdue(filing.deadline, filing.status);

                  return (
                    <div
                      key={filing.id}
                      onClick={() => onSelectClient(filing.client_id)}
                      className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-all cursor-pointer"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-semibold text-slate-800 truncate">{filing.clientName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-slate-500">{filing.filing_type}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">{filing.tax_period}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Status Badge */}
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                          filing.status === 'Documents Pending' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {filing.status}
                        </span>

                        {/* Days Remaining Label */}
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${deadlineInfo.color}`}>
                          {deadlineInfo.text}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Client Search Mini Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Key Clients List</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quick lookup of core active taxpayers.</p>
              </div>
              <button
                onClick={() => onNavigateToTab('clients')}
                className="text-xs font-medium text-[#0F2C5C] hover:text-[#1A4584] flex items-center gap-1 transition-all cursor-pointer"
              >
                Manage clients <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Client</th>
                    <th className="py-3 px-6">NTN</th>
                    <th className="py-3 px-6">ATL Status</th>
                    <th className="py-3 px-6">Outstanding Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.slice(0, 3).map((client) => {
                    const clientFees = fees.filter(fe => fe.client_id === client.id);
                    const outstanding = clientFees.reduce((sum, fe) => sum + fe.balance_due, 0);

                    return (
                      <tr 
                        key={client.id}
                        onClick={() => onSelectClient(client.id)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-all"
                      >
                        <td className="py-3.5 px-6">
                          <span className="font-semibold text-slate-800 text-sm block">{client.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{client.client_type}</span>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-xs text-slate-500">
                          {client.ntn}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            client.atl_status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {client.atl_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`text-xs font-semibold ${outstanding > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                            ₨ {outstanding.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed & Quick Summary */}
        <div className="space-y-6">
          {/* Recent activity feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit glass-shadow">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Activity Feed</h3>
                <p className="text-xs text-slate-500 mt-0.5">Staff audit trail and updates.</p>
              </div>
              <Activity className="h-4.5 w-4.5 text-slate-400" />
            </div>

            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities.slice(0, 6).map((log, logIdx) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {logIdx !== activities.slice(0, 6).length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-white">
                              {getActivityIcon(log.action)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5">
                            <p className="text-xs font-bold text-slate-800">
                              {log.action}
                            </p>
                            {log.client_name && (
                              <p className="text-[11px] font-semibold text-[#0F2C5C] hover:underline cursor-pointer" onClick={() => log.client_id && onSelectClient(log.client_id)}>
                                Client: {log.client_name}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{log.details}</p>
                            <span className="text-[9px] font-mono text-slate-400 block mt-1">
                              {formatActivityTime(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-[#0F2C5C] rounded-xl p-5 text-white shadow-lg shadow-[#0F2C5C]/20 border border-slate-700/30">
            <h3 className="text-sm font-bold mb-3 flex items-center justify-between">
              Quick Summary
              <svg className="w-4.5 h-4.5 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Fee Collection Rate</span>
                <span className="font-bold text-white">{collectionPercent}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#10B981] h-1.5 rounded-full transition-all duration-500" style={{ width: `${collectionPercent}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] pt-1 text-slate-400">
                <span>Target: PKR {(totalBilled / 1000).toFixed(0)}k</span>
                <span>Collected: PKR {(totalCollected / 1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
